# Grad app assistant
A tool to help students with PhD and Masters Program 

Currently attuned for me and my friend, Ana.

## Quick setup

1. Install dependencies: ```npm install```
2. Add ```.env``` file to /server and put ```ANTHROPIC_API_KEY="your key"```
3. Change the name(s) in the 
3. Open two terminals and run ```npm run dev``` on one and```cd server  && node index.js``` from the other terminal window.


## 📋 Complete Feature List

### Core Sections

1. **Faculty Matches**
   - Top 5-7 faculty ranked by fit
   - Research alignment analysis
   - Specific papers/projects mentioned
   - Recommendation strength scores

2. **Statement of Purpose**
   - Revised to match program
   - Faculty mentions integrated
   - Maintains your voice
   - Download as TXT/DOCX/PDF
   - LaTeX support

3. **Admission Analysis** ⭐ NEW!
   - Realistic admission percentage
   - Key strengths (3-5 points)
   - Potential weaknesses (2-4 points)
   - Fit analysis
   - 5-8 actionable steps
   - Red flags to address
   - Final recommendation

### ✅ Optional Sections (Add as Needed)

- Personal Statement
- Research Experience
- Teaching Experience
- Diversity Statement
- Leadership Experience
- Publications & Presentations
- Awards & Honors
- Career Goals
- Custom sections

### ✅ Advanced Features

**Markdown Rendering:**
- Headers (H1-H5)
- Bold and italic text
- Proper paragraph spacing
- Professional styling

**LaTeX Support:**
- Checkbox for LaTeX input
- LaTeX code output
- Copyable text box
- One-click copy to Overleaf

**Interactive Editing:**
- Quick action buttons (Trim, Shorten, Expand, etc.)
- Custom instruction text box
- Undo functionality
- Edit history tracking

**Data Management:**
- Per-applicant localStorage
- Auto-save responses
- View saved responses list
- Load previous generations
- Delete old responses

**File Handling:**
- Upload PDF/DOCX files
- OR paste text directly
- Text editor toggle
- Extracted text saved
- No re-upload needed

---

## 🆕 Latest Addition: Admission Analysis

**What it does:**
Analyzes ALL your materials and gives you:
- Honest admission percentage (e.g., 65-75%)
- What makes you competitive
- What weaknesses to address
- Specific steps to improve chances
- Whether you should apply

**Why it's amazing:**
- Most comprehensive analysis
- Uses revised SoP + all data
- Actionable, specific advice
- Helps you decide where to apply
- Identifies red flags early

---

## 📁 Files You Need

**Main Component:**
[GradApplicationAssistant-v2.jsx]
→ `src/grad-application-assistant.jsx`

**Styles:**
[GradApp.css]
→ `src/GradApp.css`

**Backend:**
[server-index.js]
→ `server/index.js` 

Good luck on applications!
