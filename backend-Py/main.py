import os
import re
import shutil
import tempfile
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
import requests
import pdfplumber
import pytesseract
from pdf2image import convert_from_path
import json
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

# Import LeetCode service modules
from services.leetcode_service import (
    get_problems,
    get_problem_by_slug_or_id,
    get_problem_internal,
    get_tags,
    get_stats,
    get_solution,
    get_random_problem,
    init_db
)
from services.code_runner import run_sample_tests, submit_solution
from services.ai_assistant import get_ai_code_assistance, stream_ai_code_assistance
from services.sheets_service import (
    get_all_sheets_overview,
    get_sheet_details,
    get_article_content,
    search_all_problems,
)

# Import Group-B Intelligence Services
from services.resume_service import (
    analyze_resume_comprehensive,
    improve_bullet_point,
    optimize_resume_section,
    generate_action_previews,
    apply_resume_actions,
    recalculate_ats_score
)
from services.interview_service import (
    generate_interview_questions,
    evaluate_interview_answer,
    generate_session_report
)
from services.company_intelligence_service import (
    get_company_intelligence,
    list_featured_companies
)

# Load environment variables
load_dotenv(override=True)
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"), override=True)

# Initialize FastAPI app
app = FastAPI(title="getPlaced AI & Intelligence Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "https://getplaced-sandy.vercel.app").split(",")
        if origin.strip()
    ] + [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "getplaced-python"}


@app.on_event("startup")
async def startup_event():
    try:
        init_db()
    except Exception as e:
        print(f"Error during startup DB init: {e}")

@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        },
    )


# ==========================================
# 1. Resume Intelligence API Endpoints
# ==========================================

def extract_text_from_pdf(pdf_path: str) -> str:
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print("PDFPlumber error:", e)

    if not text.strip():
        try:
            images = convert_from_path(pdf_path)
            for image in images:
                text += pytesseract.image_to_string(image) + "\n"
        except Exception as e:
            print("OCR fallback error:", e)

    return text.strip()

class ResumeAnalyzeJsonRequest(BaseModel):
    resume_text: str
    job_description: Optional[str] = None
    target_role: Optional[str] = None

class BulletImproveRequest(BaseModel):
    bullet: str
    target_role: Optional[str] = "Software Engineer"
    keywords: Optional[List[str]] = None

class SectionOptimizeRequest(BaseModel):
    section_type: str
    content: str
    target_role: Optional[str] = "Software Engineer"
    job_description: Optional[str] = None

@app.post("/analyze-resume")
@app.post("/analyze-resume/")
def analyze_resume_legacy(file: UploadFile = File(...), job_description: str = Form("")):
    """Legacy compatibility endpoint returning analysis and detailed JSON payload."""
    temp_dir = tempfile.mkdtemp()
    try:
        file_path = os.path.join(temp_dir, file.filename or "resume.pdf")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        resume_text = extract_text_from_pdf(file_path)
        result = analyze_resume_comprehensive(resume_text, job_description)

        # Formulate readable text for legacy clients
        text_summary = f"""ATS Score: {result.get('ats_score')}/100 ({result.get('score_tier')})
Summary: {result.get('summary_critique')}

Category Scores:
- Formatting & Structure: {result.get('category_scores', {}).get('formatting_structure')}%
- Keyword Match: {result.get('category_scores', {}).get('keyword_relevance')}%
- Impact & Metrics: {result.get('category_scores', {}).get('impact_metrics')}%
- Skills Alignment: {result.get('category_scores', {}).get('skills_alignment')}%
- Experience Match: {result.get('category_scores', {}).get('experience_relevance')}%

Matched Keywords: {', '.join([k['keyword'] for k in result.get('matched_keywords', [])])}
Missing Keywords: {', '.join([k['keyword'] for k in result.get('missing_keywords', [])])}

Top Recommendations:
{chr(10).join(['• ' + rec for rec in result.get('actionable_recommendations', [])])}
"""
        ats = result.get('ats_score')
        tier = result.get('score_tier')
        cat_scores = result.get('category_scores', {})
        result['atsScore'] = ats
        result['scoreTier'] = tier
        result['categoryScores'] = cat_scores

        return {
            "analysis": text_summary,
            "data": result,
            "evaluation": result,
            "ats_score": ats,
            "atsScore": ats,
            "score_tier": tier,
            "scoreTier": tier,
            "category_scores": cat_scores,
            "categoryScores": cat_scores,
            "extracted_text": resume_text
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in analyze_resume_legacy: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze resume: {str(e)}")
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

@app.post("/api/resume/analyze-upload")
@app.post("/api/resume/analyze-upload/")
def analyze_resume_upload_api(
    file: UploadFile = File(...),
    job_description: str = Form(""),
    target_role: str = Form("")
):
    """Multipart PDF upload endpoint for rich ATS evaluation."""
    temp_dir = tempfile.mkdtemp()
    try:
        file_path = os.path.join(temp_dir, file.filename or "resume.pdf")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        resume_text = extract_text_from_pdf(file_path)
        analysis_data = analyze_resume_comprehensive(resume_text, job_description)
        ats = analysis_data.get('ats_score')
        tier = analysis_data.get('score_tier')
        cat_scores = analysis_data.get('category_scores', {})
        analysis_data['atsScore'] = ats
        analysis_data['scoreTier'] = tier
        analysis_data['categoryScores'] = cat_scores

        return {
            "success": True,
            "filename": file.filename,
            "extracted_text": resume_text,
            "evaluation": analysis_data,
            "data": analysis_data,
            "ats_score": ats,
            "atsScore": ats,
            "score_tier": tier,
            "scoreTier": tier,
            "category_scores": cat_scores,
            "categoryScores": cat_scores,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process resume file: {str(e)}")
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

@app.post("/api/resume/analyze-text")
def analyze_resume_text_api(req: ResumeAnalyzeJsonRequest):
    """Direct JSON payload ATS evaluation."""
    try:
        analysis_data = analyze_resume_comprehensive(req.resume_text, req.job_description)
        ats = analysis_data.get('ats_score')
        tier = analysis_data.get('score_tier')
        cat_scores = analysis_data.get('category_scores', {})
        analysis_data['atsScore'] = ats
        analysis_data['scoreTier'] = tier
        analysis_data['categoryScores'] = cat_scores

        return {
            "success": True,
            "evaluation": analysis_data,
            "data": analysis_data,
            "ats_score": ats,
            "atsScore": ats,
            "score_tier": tier,
            "scoreTier": tier,
            "category_scores": cat_scores,
            "categoryScores": cat_scores,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resume analysis failed: {str(e)}")

@app.post("/api/resume/improve-bullet")
def improve_bullet_api(req: BulletImproveRequest):
    """Rewrites a weak bullet point into high-impact Google XYZ formula."""
    try:
        result = improve_bullet_point(req.bullet, req.target_role, req.keywords)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bullet improvement failed: {str(e)}")

@app.post("/api/resume/optimize-section")
def optimize_section_api(req: SectionOptimizeRequest):
    """Optimizes a resume section (Summary, Experience, Projects, Skills) with keyword injection."""
    try:
        result = optimize_resume_section(req.section_type, req.content, req.target_role, req.job_description)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Section optimization failed: {str(e)}")

class ActionPreviewRequest(BaseModel):
    resume_text: str
    actions: List[Dict[str, Any]]
    target_role: Optional[str] = "Software Engineer"
    job_description: Optional[str] = None

class ActionApplyRequest(BaseModel):
    resume_text: str
    actions: List[Dict[str, Any]]
    target_role: Optional[str] = "Software Engineer"
    job_description: Optional[str] = None
    previous_score: Optional[int] = None
    previous_category_scores: Optional[Dict[str, int]] = None

class RecalculateAtsRequest(BaseModel):
    resume_text: str
    previous_score: Optional[int] = None
    previous_category_scores: Optional[Dict[str, int]] = None
    target_role: Optional[str] = "Software Engineer"
    job_description: Optional[str] = None

@app.post("/api/resume/actions/preview")
@app.post("/resume/actions/preview")
def actions_preview_api(req: ActionPreviewRequest):
    """Generates structured before/after diff previews for chosen action items."""
    try:
        previews = generate_action_previews(
            resume_text=req.resume_text,
            actions=req.actions,
            target_role=req.target_role,
            job_description=req.job_description
        )
        return {"success": True, "previews": previews}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate action previews: {str(e)}")

@app.post("/api/resume/actions/apply")
@app.post("/resume/actions/apply")
@app.post("/api/resume/actions/apply-selected")
@app.post("/resume/actions/apply-selected")
def actions_apply_api(req: ActionApplyRequest):
    """Applies confirmed action edits to resume text and recalculates verified ATS score."""
    try:
        result = apply_resume_actions(
            resume_text=req.resume_text,
            applied_actions=req.actions,
            target_role=req.target_role,
            job_description=req.job_description,
            previous_score=req.previous_score,
            previous_category_scores=req.previous_category_scores
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to apply actions: {str(e)}")

@app.post("/api/resume/recalculate-ats")
@app.post("/resume/recalculate-ats")
def recalculate_ats_api(req: RecalculateAtsRequest):
    """Recalculates ATS score for updated resume without artificial inflation."""
    try:
        result = recalculate_ats_score(
            resume_text=req.resume_text,
            previous_score=req.previous_score,
            previous_category_scores=req.previous_category_scores,
            target_role=req.target_role,
            job_description=req.job_description
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to recalculate ATS: {str(e)}")



# ==========================================
# 2. AI Mock Interview & HR Prep API Endpoints
# ==========================================

class GenerateQuestionsRequest(BaseModel):
    company: Optional[str] = "Generic Tech"
    role: Optional[str] = "Software Engineer"
    interview_type: Optional[str] = "Mixed"  # HR, Behavioral, Technical, Mixed, System Design
    difficulty: Optional[str] = "Medium"
    count: Optional[int] = 5
    category: Optional[str] = None
    resume_text: Optional[str] = None

class EvaluateAnswerRequest(BaseModel):
    question: str
    answer: str
    company: Optional[str] = "Tech Company"
    role: Optional[str] = "Software Engineer"
    interview_type: Optional[str] = "behavioral"
    audio_duration_seconds: Optional[float] = None

class SessionReportRequest(BaseModel):
    company: str
    role: str
    interview_type: str
    answers: List[Dict[str, Any]]

@app.post("/api/interview/generate-questions")
def generate_questions_api(req: GenerateQuestionsRequest):
    """Generates personalized interview questions tailored to company & role."""
    try:
        questions = generate_interview_questions(
            company=req.company,
            role=req.role,
            interview_type=req.interview_type,
            difficulty=req.difficulty,
            count=req.count or 5,
            category=req.category,
            resume_text=req.resume_text
        )
        return {"questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Question generation failed: {str(e)}")

@app.post("/api/interview/evaluate-answer")
def evaluate_answer_api(req: EvaluateAnswerRequest):
    """Evaluates candidate's answer with STAR compliance, communication metrics & dynamic follow-up."""
    try:
        result = evaluate_interview_answer(
            question=req.question,
            answer=req.answer,
            company=req.company,
            role=req.role,
            interview_type=req.interview_type,
            audio_duration_seconds=req.audio_duration_seconds
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Answer evaluation failed: {str(e)}")

@app.post("/api/interview/session-report")
def session_report_api(req: SessionReportRequest):
    """Generates comprehensive post-session hiring report and radar scores."""
    try:
        report = generate_session_report(
            company=req.company,
            role=req.role,
            interview_type=req.interview_type,
            answers=req.answers
        )
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")


# ==========================================
# 4. Company Research & Intelligence API
# ==========================================

@app.get("/api/company/featured")
def list_featured_companies_api():
    """Lists curated top tech companies with quick metrics."""
    try:
        companies = list_featured_companies()
        return {"companies": companies}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list companies: {str(e)}")

@app.get("/api/company/intelligence")
def get_company_intelligence_api(company: str = Query("Google", description="Company name or slug")):
    """Fetches deep profile, tech stack, interview rounds, and commonly asked patterns."""
    try:
        intel = get_company_intelligence(company)
        return intel
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Company intelligence lookup failed: {str(e)}")


# ==========================================
# 5. Job Recommendations & LeetCode Platform
# ==========================================

def normalize_rapidapi_job(raw: dict) -> dict:
    if not isinstance(raw, dict):
        return {}
    job_id = raw.get("job_id") or raw.get("jobId") or raw.get("id") or raw.get("_id") or f"rapid-{uuid.uuid4().hex[:8]}"
    title = raw.get("job_title") or raw.get("title") or "Software Engineer"
    company = raw.get("employer_name") or raw.get("company") or "Technology Company"
    company_logo = raw.get("employer_logo") or raw.get("companyLogo") or ""
    city = raw.get("job_city") or raw.get("city") or ("Remote" if raw.get("job_is_remote") else "Bengaluru")
    country = raw.get("job_country") or raw.get("country") or "India"
    location = raw.get("job_location") or raw.get("location") or f"{city}, {country}"
    is_remote = bool(raw.get("job_is_remote") or raw.get("workMode") == "Remote" or "remote" in str(city).lower())
    work_mode = "Remote" if is_remote else (raw.get("workMode") or "Hybrid")

    emp_type = raw.get("job_employment_type") or raw.get("employmentType") or "Full-time"
    if isinstance(emp_type, str):
        if emp_type.upper() == "FULLTIME":
            emp_type = "Full-time"
        elif emp_type.upper() in ("INTERN", "INTERNSHIP"):
            emp_type = "Internship"
        elif emp_type.upper() == "CONTRACTOR":
            emp_type = "Contract"
        elif emp_type.upper() == "PARTTIME":
            emp_type = "Part-time"

    description = raw.get("job_description") or raw.get("description") or "Exciting engineering role building high-impact technology."
    apply_url = raw.get("job_apply_link") or raw.get("job_google_link") or raw.get("applyUrl") or raw.get("applicationUrl") or ""

    skills = raw.get("job_required_skills") or raw.get("skills") or []
    if isinstance(skills, str):
        skills = [s.strip() for s in skills.split(",") if s.strip()]
    elif not isinstance(skills, list) or len(skills) == 0:
        text_to_scan = f"{title} {description}".lower()
        common_skills = ["React", "Node.js", "Python", "Java", "C++", "Go", "TypeScript", "JavaScript", "SQL", "AWS", "Docker", "Kubernetes", "MongoDB", "Git", "REST APIs", "GraphQL"]
        skills = [s for s in common_skills if s.lower() in text_to_scan]
        if not skills:
            skills = ["Software Engineering", "Problem Solving", "Git"]

    highlights = raw.get("job_highlights") or {}
    responsibilities = highlights.get("Responsibilities") or raw.get("responsibilities") or []
    requirements = highlights.get("Qualifications") or raw.get("requirements") or []

    salary = raw.get("salary") or "Competitive CTC"
    if raw.get("job_min_salary") and raw.get("job_max_salary"):
        curr = raw.get("job_salary_currency") or "₹"
        try:
            salary = f"{curr} {int(raw['job_min_salary']):,} - {int(raw['job_max_salary']):,}"
        except Exception:
            salary = f"{curr} {raw['job_min_salary']} - {raw['job_max_salary']}"

    posted_date = raw.get("job_posted_at_datetime_utc") or raw.get("postedDate") or datetime.now(timezone.utc).isoformat()

    return {
        "_id": job_id,
        "jobId": job_id,
        "id": job_id,
        "title": title,
        "company": company,
        "companyNormalized": company.lower().strip(),
        "companyLogo": company_logo,
        "location": location,
        "city": city,
        "country": country,
        "workMode": work_mode,
        "employmentType": emp_type,
        "experience": raw.get("experience") or ("Internship" if emp_type == "Internship" else "0-2 years"),
        "experienceLevel": raw.get("experienceLevel") or ("Internship" if emp_type == "Internship" else "Entry Level"),
        "minExperienceYears": raw.get("minExperienceYears", 0),
        "maxExperienceYears": raw.get("maxExperienceYears", 2),
        "roleCategory": raw.get("roleCategory") or ("Internship" if emp_type == "Internship" else "Software Engineer"),
        "description": description,
        "responsibilities": responsibilities,
        "requirements": requirements,
        "skills": skills,
        "preferredSkills": raw.get("preferredSkills") or [],
        "education": raw.get("education") or "Bachelor's degree in Computer Science, Engineering, or related field",
        "cgpaCutoff": raw.get("cgpaCutoff", 7.0),
        "salary": salary,
        "minSalary": raw.get("job_min_salary") or raw.get("minSalary"),
        "maxSalary": raw.get("job_max_salary") or raw.get("maxSalary"),
        "salaryCurrency": raw.get("job_salary_currency") or raw.get("salaryCurrency") or "INR",
        "postedDate": posted_date,
        "lastVerifiedAt": datetime.now(timezone.utc).isoformat(),
        "applicationUrl": apply_url,
        "applyUrl": apply_url,
        "source": raw.get("source") or "RapidAPI JSearch",
        "sourceType": raw.get("sourceType") or "VERIFIED",
        "isVerified": True,
        "isExpired": False,
        "tags": raw.get("tags") or [work_mode, emp_type, "RapidAPI"],
        "companyDetails": raw.get("companyDetails") or {
            "about": f"{company} hiring tech talent via official listings.",
            "industry": "Information Technology & Software",
            "website": raw.get("employer_website") or "",
            "size": "Enterprise",
            "headquarters": location,
            "openPositionsCount": 1,
        },
    }

@app.get("/api/jobs")
@app.get("/api/jobs/recommendations")
@app.get("/job-recommendations")
def get_jobs(
    query: Optional[str] = Query(None, description="Search query"),
    location: Optional[str] = Query(None, description="Location"),
    page: Optional[str] = Query("1", description="Page number"),
    num_pages: Optional[str] = Query("2", description="Number of pages"),
    employment_type: Optional[str] = Query(None, description="Employment type"),
):
    # Try fetching from Node backend canonical jobs API first to maintain unified dataset
    node_api_url = os.getenv("NODE_API_URL", "http://localhost:3000")
    try:
        node_res = requests.get(
            f"{node_api_url}/api/jobs",
            params={
                "search": query or "",
                "location": location or "ALL",
                "employmentType": employment_type or "ALL",
                "page": page or "1"
            },
            timeout=3
        )
        if node_res.status_code == 200:
            data = node_res.json()
            if data.get("jobs"):
                return {
                    "success": True,
                    "jobs": data.get("jobs", []),
                    "recommendedJobs": data.get("recommendedJobs", []),
                    "targetCompanyJobs": data.get("targetCompanyJobs", []),
                    "meta": data.get("meta", {}),
                    "source": "canonical_node_api"
                }
    except Exception as e:
        pass

    query_str = query if isinstance(query, str) else None
    loc_str = location if isinstance(location, str) else None
    page_str = page if isinstance(page, str) else "1"
    num_pages_str = num_pages if isinstance(num_pages, str) else "2"
    emp_type_str = employment_type if isinstance(employment_type, str) else None

    search_q = query_str or "developer in India"
    if loc_str and loc_str.lower() not in search_q.lower():
        search_q = f"{search_q} in {loc_str}"

    querystring = {
        "query": search_q,
        "page": str(page_str or "1"),
        "num_pages": str(num_pages_str or "2"),
    }
    if emp_type_str:
        querystring["employment_types"] = emp_type_str

    api_key = os.getenv("RAPIDAPI_KEY")
    if api_key:
        headers = {
            "X-RapidAPI-Key": api_key,
            "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
        }
        url = "https://jsearch.p.rapidapi.com/search"
        try:
            response = requests.get(url, headers=headers, params=querystring, timeout=5)
            if response.status_code == 200:
                data = response.json()
                raw_jobs = data.get("data", [])
                if raw_jobs:
                    normalized = [normalize_rapidapi_job(j) for j in raw_jobs]
                    return {"success": True, "jobs": normalized, "source": "live_rapidapi"}
        except Exception as e:
            print(f"RapidAPI lookup error in get_jobs: {e}")

    # Fallback to standard verified seed dataset
    return {
        "success": True,
        "jobs": [
            normalize_rapidapi_job({
                "job_id": "gp-job-001",
                "job_title": "Software Development Engineer - 1 (Backend)",
                "employer_name": "Microsoft",
                "employer_logo": "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg",
                "job_city": "Bengaluru",
                "job_country": "India",
                "job_is_remote": False,
                "job_employment_type": "Full-time",
                "job_description": "Join the Azure Cloud Core team to build ultra-scalable distributed control planes, telemetry ingest pipelines, and high-throughput microservices.",
                "job_apply_link": "https://careers.microsoft.com",
                "job_required_skills": ["Java", "C#", "Azure", "Distributed Systems", "SQL", "Git", "REST APIs"],
                "job_min_salary": 1800000,
                "job_max_salary": 2800000,
                "job_salary_currency": "INR",
            }),
            normalize_rapidapi_job({
                "job_id": "gp-job-002",
                "job_title": "Software Engineer - Full Stack (React & Go)",
                "employer_name": "Google",
                "employer_logo": "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
                "job_city": "Hyderabad",
                "job_country": "India",
                "job_is_remote": True,
                "job_employment_type": "Full-time",
                "job_description": "Design and engineer high-performance web applications and cloud developer infrastructure.",
                "job_apply_link": "https://careers.google.com",
                "job_required_skills": ["React", "Go", "TypeScript", "GCP", "Kubernetes", "GraphQL"],
                "job_min_salary": 2400000,
                "job_max_salary": 3800000,
                "job_salary_currency": "INR",
            }),
            normalize_rapidapi_job({
                "job_id": "gp-job-003",
                "job_title": "Frontend Engineer (React 19, TypeScript & Next.js)",
                "employer_name": "Amazon",
                "employer_logo": "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
                "job_city": "Bengaluru",
                "job_country": "India",
                "job_is_remote": False,
                "job_employment_type": "Full-time",
                "job_description": "Deliver sub-100ms e-commerce and AWS console experiences using cutting-edge frontend architecture.",
                "job_apply_link": "https://amazon.jobs",
                "job_required_skills": ["React", "TypeScript", "Next.js", "Tailwind CSS", "Redux", "Web Vitals"],
                "job_min_salary": 1600000,
                "job_max_salary": 2600000,
                "job_salary_currency": "INR",
            }),
        ],
        "source": "canonical_dataset"
    }


class CodeRunRequest(BaseModel):
    code: str
    custom_cases: Optional[List[Dict[str, str]]] = None

class CodeSubmitRequest(BaseModel):
    code: str

class AIAssistRequest(BaseModel):
    code: str
    query_type: str = "hint"  # hint, explain, debug, optimize
    error_message: Optional[str] = None

@app.get("/api/problems")
def list_problems(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    difficulty: Optional[str] = None,
    tag: Optional[str] = None,
    sort_by: str = Query("question_id"),
    sort_order: str = Query("asc")
):
    try:
        return get_problems(
            page=page,
            page_size=page_size,
            search=search,
            difficulty=difficulty,
            tag=tag,
            sort_by=sort_by,
            sort_order=sort_order
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch problems: {str(e)}")

@app.get("/api/problems/tags")
def list_tags():
    try:
        return {"tags": get_tags()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch tags: {str(e)}")

@app.get("/api/problems/stats")
def problem_stats():
    try:
        return get_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch stats: {str(e)}")

@app.get("/api/problems/random")
def random_problem(difficulty: Optional[str] = None, tag: Optional[str] = None):
    try:
        prob = get_random_problem(difficulty=difficulty, tag=tag)
        if not prob:
            raise HTTPException(status_code=404, detail="No matching problem found.")
        return prob
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch random problem: {str(e)}")

@app.get("/api/problems/{slug_or_id}")
def get_single_problem(slug_or_id: str):
    prob = get_problem_by_slug_or_id(slug_or_id)
    if not prob:
        raise HTTPException(status_code=404, detail=f"Problem '{slug_or_id}' not found.")
    return prob

@app.get("/api/problems/{slug_or_id}/solution")
def get_problem_solution_endpoint(slug_or_id: str):
    sol = get_solution(slug_or_id)
    if not sol:
        raise HTTPException(status_code=404, detail=f"Solution for '{slug_or_id}' not found.")
    return sol

@app.post("/api/problems/{slug_or_id}/run")
def run_problem_code(slug_or_id: str, req: CodeRunRequest):
    prob = get_problem_internal(slug_or_id)
    if not prob:
        raise HTTPException(status_code=404, detail=f"Problem '{slug_or_id}' not found.")
    try:
        result = run_sample_tests(prob, req.code, req.custom_cases)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Execution error: {str(e)}")

@app.post("/api/problems/{slug_or_id}/submit")
def submit_problem_code(slug_or_id: str, req: CodeSubmitRequest):
    prob = get_problem_internal(slug_or_id)
    if not prob:
        raise HTTPException(status_code=404, detail=f"Problem '{slug_or_id}' not found.")
    try:
        result = submit_solution(prob, req.code)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Submission error: {str(e)}")

@app.post("/api/problems/{slug_or_id}/ai-assist")
def ai_assist_endpoint(slug_or_id: str, req: AIAssistRequest):
    prob = get_problem_by_slug_or_id(slug_or_id)
    if not prob:
        raise HTTPException(status_code=404, detail=f"Problem '{slug_or_id}' not found.")
    try:
        feedback = get_ai_code_assistance(
            problem_title=prob["title"],
            problem_description=prob["problem_description"],
            user_code=req.code,
            query_type=req.query_type,
            error_message=req.error_message
        )
        return {"response": feedback, "query_type": req.query_type}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Assistance failed: {str(e)}")

@app.post("/api/problems/{slug_or_id}/ai-assist-stream")
async def ai_assist_stream_endpoint(slug_or_id: str, req: AIAssistRequest):
    prob = get_problem_by_slug_or_id(slug_or_id)
    if not prob:
        raise HTTPException(status_code=404, detail=f"Problem '{slug_or_id}' not found.")

    async def event_stream():
        try:
            for text_chunk in stream_ai_code_assistance(
                problem_title=prob["title"],
                problem_description=prob["problem_description"],
                user_code=req.code,
                query_type=req.query_type,
                error_message=req.error_message
            ):
                if text_chunk:
                    yield f"data: {json.dumps({'chunk': text_chunk})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Content-Type": "text/event-stream; charset=utf-8",
        }
    )


# ==========================================
# 6. Striver & Placement Curricula Sheets API
# ==========================================

@app.get("/api/sheets")
def list_sheets_api():
    """Returns overview of all 28 DSA Sheets, Playlists, and TUF+ Courses."""
    try:
        return get_all_sheets_overview()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch sheets overview: {str(e)}")

@app.get("/api/sheets/search")
def search_sheets_problems_api(
    q: str = Query("", description="Search query"),
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    sheet_id: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100)
):
    """Searches across all 3,150 problems in Striver & TUF sheets."""
    try:
        return search_all_problems(
            query=q,
            category=category,
            difficulty=difficulty,
            sheet_id=sheet_id,
            page=page,
            page_size=page_size
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@app.get("/api/sheets/articles/{slug_or_id}")
def get_sheet_article_api(slug_or_id: str):
    """Returns full offline Markdown article tutorial, code snippets, and problem statements."""
    article = get_article_content(slug_or_id)
    if not article:
        raise HTTPException(status_code=404, detail=f"Article '{slug_or_id}' not found.")
    return article

@app.get("/api/sheets/{sheet_id}")
def get_sheet_api(sheet_id: str):
    """Returns complete hierarchical tree of sections, subcategories, problems, and links for a specific sheet."""
    sheet = get_sheet_details(sheet_id)
    if not sheet:
        raise HTTPException(status_code=404, detail=f"Sheet '{sheet_id}' not found.")
    return sheet


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
