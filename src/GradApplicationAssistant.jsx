import React, { useState, useEffect } from 'react';
import { Upload, ChevronLeft, ChevronRight, Plus, Download, Search, Loader2, X } from 'lucide-react';
import './GradApp.css';

const GradApplicationAssistant = () => {
  const [selectedApplicant, setSelectedApplicant] = useState('');
  const [files, setFiles] = useState({
    cv: null,
    sop: null,
    transcripts: null,
    personalStatement: null
  });
  const [programInfo, setProgramInfo] = useState({
    collegeName: '',
    program: '',
    major: '',
    interests: []
  });
  const [sections, setSections] = useState([]);
  const [customInterests, setCustomInterests] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [setupComplete, setSetupComplete] = useState(false);
  const [showSectionPicker, setShowSectionPicker] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [showSavedResponses, setShowSavedResponses] = useState(false);
  const [savedResponsesList, setSavedResponsesList] = useState([]);
  const [showFileTextEditor, setShowFileTextEditor] = useState({
    cv: false,
    sop: false,
    personalStatement: false
  });
  const [fileTexts, setFileTexts] = useState({
    cv: '',
    sop: '',
    personalStatement: ''
  });
  const [isLatex, setIsLatex] = useState({
    sop: false,
    personalStatement: false
  });
  const [editingSection, setEditingSection] = useState(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editHistory, setEditHistory] = useState({});

  const applicants = ['Your Name (edit in code)', 'Second User Name'];
  
  const majorOptions = [
    'Electrical Engineering',
    'Computer Science',
    'Biomedical Engineering',
    'Mechanical Engineering',
    'Chemical Engineering',
    'Materials Science',
    'Physics',
    'Mathematics',
    'Other (specify)'
  ];

  const defaultInterests = [
    'Medical Imaging',
    'NLP + Cognitive Science',
    'Human-Centric AI',
    'Signal Processing',
    'Machine Learning',
    'Robotics',
    'Computer Vision',
    'Quantum Computing',
    'Bioelectronics'
  ];

  const defaultSections = [
    { id: 'faculty', name: 'Faculty Matches', questions: [] },
    { id: 'sop', name: 'Statement of Purpose', questions: [] },
    { id: 'admission-analysis', name: 'Admission Analysis', questions: [] }
  ];

  const commonSectionTemplates = [
    { id: 'personal', name: 'Personal Statement', questions: [], freeformContent: '' },
    { id: 'research', name: 'Research Experience', questions: ['Describe your research experience', 'What methodologies have you used?'], freeformContent: '' },
    { id: 'teaching', name: 'Teaching Experience', questions: ['Describe any teaching or mentoring experience'], freeformContent: '' },
    { id: 'diversity', name: 'Diversity Statement', questions: ['How will you contribute to diversity?'], freeformContent: '' },
    { id: 'leadership', name: 'Leadership Experience', questions: ['Describe your leadership experience'], freeformContent: '' },
    { id: 'publications', name: 'Publications & Presentations', questions: ['List and describe your publications'], freeformContent: '' },
    { id: 'awards', name: 'Awards & Honors', questions: ['Describe significant awards and honors'], freeformContent: '' },
    { id: 'goals', name: 'Career Goals', questions: ['What are your long-term career goals?'], freeformContent: '' }
  ];

  useEffect(() => {
    // Load global custom interests
    const saved = localStorage.getItem('customInterests');
    if (saved) setCustomInterests(JSON.parse(saved));
    
    // Initialize section templates if not exists
    const savedSectionNames = localStorage.getItem('allUsedSectionNames');
    if (!savedSectionNames) {
      localStorage.setItem('allUsedSectionNames', JSON.stringify(
        commonSectionTemplates.map(s => ({ id: s.id, name: s.name }))
      ));
    }
  }, []);

  // Load applicant-specific data when applicant changes
  useEffect(() => {
    if (selectedApplicant) {
      loadApplicantData(selectedApplicant);
      loadSavedResponsesList();
    } else {
      setSections(defaultSections);
      setFiles({ cv: null, sop: null, transcripts: null, personalStatement: null });
      setProgramInfo({ collegeName: '', program: '', major: '', interests: [] });
      setSavedResponsesList([]);
      setFileTexts({ cv: '', sop: '', personalStatement: '' });
    }
  }, [selectedApplicant]);

  const loadApplicantData = (applicantName) => {
    const key = `applicant_${applicantName.replace(/\s+/g, '_')}`;
    const saved = localStorage.getItem(key);
    
    if (saved) {
      const data = JSON.parse(saved);
      setSections(data.sections || defaultSections);
      setProgramInfo(data.programInfo || { collegeName: '', program: '', major: '', interests: [] });
      if (data.fileTexts) {
        setFileTexts(data.fileTexts);
      }
    } else {
      setSections(defaultSections);
      setProgramInfo({ collegeName: '', program: '', major: '', interests: [] });
      setFileTexts({ cv: '', sop: '', personalStatement: '' });
    }
  };

  const saveApplicantData = () => {
    if (!selectedApplicant) return;
    
    const key = `applicant_${selectedApplicant.replace(/\s+/g, '_')}`;
    const data = {
      sections: sections,
      programInfo: programInfo,
      fileNames: {
        cv: files.cv?.name,
        sop: files.sop?.name,
        transcripts: files.transcripts?.name,
        personalStatement: files.personalStatement?.name
      },
      fileTexts: fileTexts,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem(key, JSON.stringify(data));
  };

  const saveResponses = () => {
    if (!selectedApplicant || !programInfo.collegeName || !programInfo.program) {
      alert('Cannot save: missing applicant or program info');
      return;
    }

    const responseKey = `responses_${selectedApplicant.replace(/\s+/g, '_')}_${Date.now()}`;
    const responseData = {
      applicant: selectedApplicant,
      collegeName: programInfo.collegeName,
      program: programInfo.program,
      major: programInfo.major,
      interests: programInfo.interests,
      sections: sections,
      responses: responses,
      fileTexts: fileTexts,
      savedAt: new Date().toISOString()
    };

    localStorage.setItem(responseKey, JSON.stringify(responseData));
    
    // Update saved responses list
    loadSavedResponsesList();
    
    alert('Responses saved successfully!');
  };

  const loadSavedResponsesList = () => {
    if (!selectedApplicant) {
      setSavedResponsesList([]);
      return;
    }

    const prefix = `responses_${selectedApplicant.replace(/\s+/g, '_')}_`;
    const allKeys = Object.keys(localStorage);
    const responseKeys = allKeys.filter(key => key.startsWith(prefix));
    
    const responsesList = responseKeys.map(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        return {
          key: key,
          ...data
        };
      } catch {
        return null;
      }
    }).filter(Boolean);

    // Sort by date, newest first
    responsesList.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
    
    setSavedResponsesList(responsesList);
  };

  const loadSavedResponse = (responseData) => {
    // Load the program info
    setProgramInfo({
      collegeName: responseData.collegeName,
      program: responseData.program,
      major: responseData.major,
      interests: responseData.interests
    });

    // Load sections
    setSections(responseData.sections);

    // Load responses
    setResponses(responseData.responses);

    // Load file texts if available
    if (responseData.fileTexts) {
      setFileTexts(responseData.fileTexts);
    }

    // Mark as complete so it shows results
    setSetupComplete(true);
    setShowSavedResponses(false);
  };

  const deleteSavedResponse = (key) => {
    if (confirm('Are you sure you want to delete this saved response?')) {
      localStorage.removeItem(key);
      loadSavedResponsesList();
    }
  };

  // Save whenever important data changes
  useEffect(() => {
    if (selectedApplicant && sections.length > 0) {
      saveApplicantData();
    }
  }, [sections, programInfo]);

  const saveCustomInterests = (interests) => {
    setCustomInterests(interests);
    localStorage.setItem('customInterests', JSON.stringify(interests));
  };

  const handleFileUpload = (type, e) => {
    const file = e.target.files[0];
    if (file) {
      setFiles(prev => ({ ...prev, [type]: file }));
    }
  };

  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result.split(',')[1];
        resolve({
          data: base64Data,
          mimeType: file.type || 'application/pdf'
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const callClaudeAPI = async (prompt, systemPrompt = '', documents = []) => {
    try {
      // Build content array with text and documents
      const content = [];
      
      // Add documents first
      if (documents && documents.length > 0) {
        documents.forEach(doc => {
          content.push({
            type: "document",
            source: {
              type: "base64",
              media_type: doc.mimeType,
              data: doc.data
            }
          });
        });
      }
      
      // Add text prompt
      content.push({
        type: "text",
        text: prompt
      });

      const response = await fetch('http://localhost:3001/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 8000,
          system: systemPrompt,
          messages: [{ role: 'user', content: content }]
        })
      });

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg;
        try {
          const errorJson = JSON.parse(errorText);
          errorMsg = errorJson.error?.message || errorJson.message || 'API request failed';
        } catch {
          errorMsg = `Server error (${response.status}): ${errorText.substring(0, 200)}`;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'API request failed');
      }
      
      return data.content.map(item => item.type === 'text' ? item.text : '').join('\n');
    } catch (error) {
      console.error('API Error:', error);
      
      // Better error messages
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to backend server. Make sure it is running on port 3001.');
      }
      
      throw error;
    }
  };

  const processApplication = async () => {
    if (!selectedApplicant || !programInfo.collegeName || !programInfo.program) {
      alert('Please complete all required fields');
      return;
    }

    setLoading(true);
    setProcessingStep('Analyzing application materials...');

    try {
      let cvText = '', sopText = '', psText = '';
      let cvDoc = null, sopDoc = null, psDoc = null;
      
      // Read CV - use uploaded file or saved text
      if (files.cv) {
        cvDoc = await readFileAsBase64(files.cv);
        const cvExtract = await callClaudeAPI(
          'Extract all text from this CV/resume document. Provide a complete, organized extraction of all content.',
          'You are analyzing a CV. Extract all text content clearly and organize it by sections.',
          [cvDoc]
        );
        cvText = cvExtract;
        // Save extracted text
        setFileTexts(prev => ({ ...prev, cv: cvText }));
      } else if (fileTexts.cv) {
        cvText = fileTexts.cv;
      }

      // Read SoP - use uploaded file or saved text
      if (files.sop) {
        sopDoc = await readFileAsBase64(files.sop);
        sopText = await callClaudeAPI(
          'Extract the complete text from this Statement of Purpose document.',
          'Extract all text content from this statement of purpose.',
          [sopDoc]
        );
        // Save extracted text
        setFileTexts(prev => ({ ...prev, sop: sopText }));
      } else if (fileTexts.sop) {
        sopText = fileTexts.sop;
      }

      // Read Personal Statement - use uploaded file or saved text
      if (files.personalStatement) {
        psDoc = await readFileAsBase64(files.personalStatement);
        psText = await callClaudeAPI(
          'Extract the complete text from this Personal Statement document.',
          'Extract all text content from this personal statement.',
          [psDoc]
        );
        // Save extracted text
        setFileTexts(prev => ({ ...prev, personalStatement: psText }));
      } else if (fileTexts.personalStatement) {
        psText = fileTexts.personalStatement;
      }

      if (!cvText || cvText.length < 100) {
        alert('Could not extract CV content. Please upload a CV file or paste CV text in the editor.');
        setLoading(false);
        return;
      }

      if (!sopText || sopText.length < 100) {
        alert('Could not extract SoP content. Please upload an SoP file or paste SoP text in the editor.');
        setLoading(false);
        return;
      }

      setProcessingStep('Finding best faculty matches...');
      const facultyPrompt = `Based on the following information, research and identify the top 5-7 faculty members at ${programInfo.collegeName} in the ${programInfo.program} program who would be the best fit for this applicant.

Applicant: ${selectedApplicant}
Research Interests: ${programInfo.interests.join(', ')}
Major: ${programInfo.major}

CV Summary:
${cvText.substring(0, 3000)}

Statement of Purpose:
${sopText.substring(0, 2000)}

Please provide:
1. Faculty name and title
2. Research area alignment
3. Specific projects/papers that align
4. Why they would be a great match (2-3 sentences)
5. Recommendation strength (1-10)

Format as a ranked list.`;

      const facultyMatches = await callClaudeAPI(
        facultyPrompt,
        'You are an expert graduate admissions advisor. Research faculty at the specified institution using your knowledge and provide detailed, accurate recommendations. Be specific about research alignment. IMPORTANT: Do not use em dashes in your writing. Avoid colons unless absolutely necessary.'
      );

      setResponses(prev => ({ ...prev, faculty: facultyMatches }));

      setProcessingStep('Revising Statement of Purpose...');
      
      // Detect if SoP is in LaTeX format
      const sopIsLatex = sopText.includes('\\documentclass') || 
                        sopText.includes('\\begin{document}') || 
                        isLatex.sop;
      
      const latexInstructions = sopIsLatex 
        ? 'The original statement is in LaTeX format. Maintain LaTeX formatting in your response. Use proper LaTeX commands and structure.'
        : '';
      
      const revisedSOP = await callClaudeAPI(
        `Revise this Statement of Purpose for ${programInfo.collegeName}'s ${programInfo.program} program. Incorporate the following faculty interests and program specifics. Maintain the applicant's voice but strengthen alignment with the program.

Target Program: ${programInfo.program} at ${programInfo.collegeName}
Research Interests: ${programInfo.interests.join(', ')}
Faculty to mention: Use the top 2-3 faculty from the analysis above

Original Statement of Purpose:
${sopText}

${latexInstructions}

Create a compelling, specific SoP that demonstrates clear fit with the program. Match the tone, style, and language patterns of the original SoP.`,
        `You are an expert at crafting graduate school statements. Maintain authenticity while demonstrating specific program knowledge and research alignment. CRITICAL FORMATTING RULES: Never use em dashes. Minimize colon usage (only use when absolutely necessary). Match the writing style, tone, and formality level of the original statement. ${latexInstructions}`
      );

      setResponses(prev => ({ ...prev, sop: revisedSOP, sopIsLatex }));

      if (psText && psText.length > 100) {
        setProcessingStep('Revising Personal Statement...');
        
        // Detect if Personal Statement is in LaTeX format
        const psIsLatex = psText.includes('\\documentclass') || 
                         psText.includes('\\begin{document}') || 
                         isLatex.personalStatement;
        
        const latexInstructions = psIsLatex 
          ? 'The original statement is in LaTeX format. Maintain LaTeX formatting in your response. Use proper LaTeX commands and structure.'
          : '';
        
        const revisedPS = await callClaudeAPI(
          `Revise this Personal Statement to better address themes of personal growth, challenges overcome, and unique perspective. Tailor it for a graduate application to ${programInfo.collegeName}.

Original Personal Statement:
${psText}

${latexInstructions}

Maintain the personal voice but strengthen narrative coherence and impact. Match the tone, style, and language patterns of the original personal statement.`,
          `You are an expert at crafting compelling personal narratives for graduate applications. Focus on authenticity, growth, and resilience. CRITICAL FORMATTING RULES: Never use em dashes. Minimize colon usage (only use when absolutely necessary). Match the writing style, tone, and personal voice of the original statement exactly. ${latexInstructions}`
        );

        setResponses(prev => ({ ...prev, personal: revisedPS, personalIsLatex: psIsLatex }));
      }

      setProcessingStep('Answering application questions...');
      for (const section of sections) {
        if (section.id !== 'faculty' && section.id !== 'sop' && section.id !== 'personal' && section.id !== 'admission-analysis') {
          // Check if section has freeform content
          if (section.freeformContent && section.freeformContent.trim()) {
            const freeformPrompt = `Based on this applicant's profile and the application section content provided below, generate all necessary responses.

Application Section: ${section.name}
Section Content/Questions:
${section.freeformContent}

Context:
- Applicant: ${selectedApplicant}
- Program: ${programInfo.program} at ${programInfo.collegeName}
- Research Interests: ${programInfo.interests.join(', ')}

CV Summary: ${cvText.substring(0, 2000)}
SoP Summary: ${sopText.substring(0, 1000)}
${psText ? `Personal Statement Summary: ${psText.substring(0, 1000)}` : ''}

Analyze the section content and provide comprehensive, well-organized responses to all questions or prompts. Structure your response clearly with headings if there are multiple questions.`;

            const personalKeywords = ['diversity', 'community', 'background', 'culture', 'personal', 'identity', 'experience', 'challenges', 'overcome', 'perspective', 'contribute'];
            const isPersonalSection = personalKeywords.some(keyword => 
              section.freeformContent.toLowerCase().includes(keyword) || section.name.toLowerCase().includes(keyword)
            );
            
            const toneReference = isPersonalSection 
              ? 'Match the personal, authentic tone and writing style of the personal statement provided.'
              : 'Match the formal, academic tone and writing style of the statement of purpose provided.';

            const answer = await callClaudeAPI(
              freeformPrompt,
              `You are answering graduate application questions. Be specific, genuine, and demonstrate clear alignment with the program and research interests. CRITICAL FORMATTING RULES: Never use em dashes. Minimize colon usage (only use when absolutely necessary). ${toneReference}`
            );

            setResponses(prev => ({
              ...prev,
              [section.id]: { freeform: answer }
            }));
          }
          // Process individual questions if they exist
          else if (section.questions && section.questions.length > 0) {
            for (const question of section.questions) {
              const personalKeywords = ['diversity', 'community', 'background', 'culture', 'personal', 'identity', 'experience', 'challenges', 'overcome', 'perspective', 'contribute'];
              const isPersonalQuestion = personalKeywords.some(keyword => 
                question.toLowerCase().includes(keyword)
              );
              
              const toneReference = isPersonalQuestion 
                ? 'Match the personal, authentic tone and writing style of the personal statement provided.'
                : 'Match the formal, academic tone and writing style of the statement of purpose provided.';
              
              const referenceText = isPersonalQuestion
                ? `Personal Statement tone reference:\n${psText.substring(0, 500)}`
                : `Statement of Purpose tone reference:\n${sopText.substring(0, 500)}`;

              const answer = await callClaudeAPI(
                `Based on this applicant's profile, answer the following application question:

Question: ${question}

Context:
- Applicant: ${selectedApplicant}
- Program: ${programInfo.program} at ${programInfo.collegeName}
- Research Interests: ${programInfo.interests.join(', ')}

CV Summary: ${cvText.substring(0, 1500)}

${referenceText}

Provide a compelling 200-300 word response that demonstrates fit and authenticity. ${toneReference}`,
                `You are answering graduate application questions. Be specific, genuine, and demonstrate clear alignment with the program and research interests. CRITICAL FORMATTING RULES: Never use em dashes. Minimize colon usage (only use when absolutely necessary). ${toneReference}`
              );

              setResponses(prev => ({
                ...prev,
                [section.id]: {
                  ...(prev[section.id] || {}),
                  [question]: answer
                }
              }));
            }
          }
        }
      }

      // Generate Admission Analysis
      setProcessingStep('Analyzing admission chances...');
      const admissionAnalysisPrompt = `You are an expert graduate admissions consultant. Analyze this applicant's chances of admission and provide detailed, honest feedback.

APPLICANT PROFILE:
Name: ${selectedApplicant}
Target Program: ${programInfo.program}
Target Institution: ${programInfo.collegeName}
Major/Concentration: ${programInfo.major}
Research Interests: ${programInfo.interests.join(', ')}

COMPLETE CV:
${cvText}

REVISED STATEMENT OF PURPOSE:
${responses.sop || sopText}

${psText ? `PERSONAL STATEMENT:\n${psText}\n` : ''}

FACULTY ALIGNMENT:
${responses.faculty}

TASK:
Provide a comprehensive admission analysis with the following sections:

1. **Admission Chances Estimate**
   - Provide a realistic percentage range (e.g., 60-75%)
   - Rate as: Very Strong / Strong / Competitive / Moderate / Reach
   - Brief justification (2-3 sentences)

2. **Key Strengths** (3-5 points)
   - What makes this applicant stand out?
   - Specific achievements, experiences, or qualities

3. **Potential Weaknesses or Gaps** (2-4 points)
   - Be honest but constructive
   - What might raise concerns for the admissions committee?
   - What's missing from the profile?

4. **Fit Analysis**
   - How well does the applicant align with this specific program?
   - Research fit
   - Faculty matches
   - Program culture/values

5. **Actionable Steps to Strengthen Application** (5-8 steps)
   - Concrete, specific actions they can take NOW
   - Prioritize by impact
   - Include both quick wins and longer-term improvements
   - Be realistic about timelines

6. **Red Flags to Address** (if any)
   - Issues that MUST be addressed in the application
   - How to address them

7. **Final Recommendation**
   - Should they apply?
   - Apply as reach/target/safety?
   - Any alternative strategies?

Be honest, specific, and actionable. Use data and examples from their materials. Focus on improvement, not discouragement.`;

      const admissionAnalysis = await callClaudeAPI(
        admissionAnalysisPrompt,
        'You are an expert graduate admissions consultant with deep knowledge of PhD/MS admissions processes. Provide honest, data-driven, actionable advice. CRITICAL FORMATTING RULES: Never use em dashes. Minimize colon usage (only use when absolutely necessary). Use markdown formatting with ## for section headers and **bold** for emphasis.'
      );

      setResponses(prev => ({ ...prev, 'admission-analysis': admissionAnalysis }));

      setSetupComplete(true);
      setLoading(false);
      setProcessingStep('');
      
      // Auto-save responses
      setTimeout(() => {
        saveResponses();
      }, 500);
    } catch (error) {
      console.error('Processing error:', error);
      alert(`Error processing application: ${error.message}`);
      setLoading(false);
      setProcessingStep('');
    }
  };

  const addSectionFromTemplate = (template) => {
    const newSection = { ...template };
    const updated = [...sections, newSection];
    setSections(updated);
    
    const allUsedNames = JSON.parse(localStorage.getItem('allUsedSectionNames') || '[]');
    const exists = allUsedNames.some(s => s.id === template.id);
    if (!exists) {
      allUsedNames.push({ id: template.id, name: template.name });
      localStorage.setItem('allUsedSectionNames', JSON.stringify(allUsedNames));
    }
  };

  const addCustomSection = () => {
    const sectionName = prompt('Enter section name:');
    if (sectionName) {
      const newSection = {
        id: sectionName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
        name: sectionName,
        questions: []
      };
      const updated = [...sections, newSection];
      setSections(updated);
      
      const allUsedNames = JSON.parse(localStorage.getItem('allUsedSectionNames') || '[]');
      allUsedNames.push({ id: newSection.id, name: newSection.name });
      localStorage.setItem('allUsedSectionNames', JSON.stringify(allUsedNames));
    }
  };

  const moveSection = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (index < 3 || newIndex < 3 || newIndex >= sections.length) return;
    
    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    
    setSections(updated);
  };

  const removeSection = (index) => {
    if (index < 3) return;
    
    const updated = sections.filter((_, i) => i !== index);
    setSections(updated);
  };

  const addQuestion = (sectionId) => {
    const question = prompt('Enter question:');
    if (question) {
      const updated = sections.map(s => 
        s.id === sectionId 
          ? { ...s, questions: [...s.questions, question] }
          : s
      );
      setSections(updated);
    }
  };

  const updateSectionContent = (sectionId, content) => {
    const updated = sections.map(s => 
      s.id === sectionId 
        ? { ...s, freeformContent: content }
        : s
    );
    setSections(updated);
  };

  const addCustomInterest = () => {
    const interest = prompt('Enter custom research interest:');
    if (interest && !defaultInterests.includes(interest) && !customInterests.includes(interest)) {
      saveCustomInterests([...customInterests, interest]);
    }
  };

  const downloadDocument = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const markdownToHTML = (text) => {
    if (!text) return '';
    
    let html = text;
    
    // Headers (h1-h6)
    html = html.replace(/^##### (.*$)/gim, '<h5>$1</h5>');
    html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br/>');
    
    // Wrap in paragraph if not already wrapped
    if (!html.startsWith('<')) {
      html = '<p>' + html + '</p>';
    }
    
    return html;
  };

  const downloadAsDOCX = async (content, filename) => {
    try {
      // Create a simple DOCX structure
      const docxContent = `
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t xml:space="preserve">${content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;
      
      const blob = new Blob([docxContent], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error creating DOCX. Downloading as TXT instead.');
      downloadDocument(content, filename.replace('.docx', '.txt'));
    }
  };

  const downloadAsPDF = async (content, filename) => {
    // For now, download as text and suggest user convert
    // Full PDF generation would require a library like jsPDF
    alert('PDF generation requires additional setup. Downloading as TXT for now.\n\nYou can:\n1. Copy the content\n2. Paste into Google Docs\n3. Download as PDF from there');
    downloadDocument(content, filename.replace('.pdf', '.txt'));
  };

  const editSectionContent = async (sectionId, editInstruction, wordLimit = null, pageLimit = null) => {
    setEditLoading(true);
    
    try {
      const currentContent = responses[sectionId];
      const contentToEdit = typeof currentContent === 'object' && currentContent.freeform 
        ? currentContent.freeform 
        : currentContent;

      // Build context from saved data
      const contextInfo = `
Context:
- Applicant: ${selectedApplicant}
- Program: ${programInfo.program} at ${programInfo.collegeName}
- Research Interests: ${programInfo.interests.join(', ')}

${fileTexts.cv ? `CV Summary:\n${fileTexts.cv.substring(0, 2000)}\n` : ''}
${fileTexts.sop ? `Original SoP:\n${fileTexts.sop.substring(0, 1500)}\n` : ''}
${fileTexts.personalStatement ? `Original Personal Statement:\n${fileTexts.personalStatement.substring(0, 1500)}\n` : ''}
`;

      const limitInfo = wordLimit 
        ? `IMPORTANT: The final output must be EXACTLY ${wordLimit} words or fewer.`
        : pageLimit 
        ? `IMPORTANT: The final output must fit within ${pageLimit} page(s) (approximately ${pageLimit * 250} words).`
        : '';

      const latexInfo = (sectionId === 'sop' && responses.sopIsLatex) || 
                       (sectionId === 'personal' && responses.personalIsLatex)
        ? 'IMPORTANT: The content is in LaTeX format. Maintain LaTeX formatting in your response.'
        : '';

      const editRequest = `
${editInstruction}

${limitInfo}
${latexInfo}

Current content to edit:
${contentToEdit}

${contextInfo}

Please provide the edited version. ${latexInfo ? 'Output in LaTeX format.' : ''} Maintain the same tone and style as the original. ${limitInfo}
`;

      const systemPrompt = `You are editing graduate application content. Follow the user's instructions precisely. ${limitInfo} ${latexInfo} CRITICAL FORMATTING RULES: Never use em dashes. Minimize colon usage (only use when absolutely necessary).`;

      const editedContent = await callClaudeAPI(editRequest, systemPrompt);

      // Save to edit history
      if (!editHistory[sectionId]) {
        editHistory[sectionId] = [];
      }
      editHistory[sectionId].push({
        original: contentToEdit,
        edited: editedContent,
        instruction: editInstruction,
        timestamp: new Date().toISOString()
      });

      // Update responses
      if (typeof responses[sectionId] === 'object' && responses[sectionId].freeform) {
        setResponses(prev => ({
          ...prev,
          [sectionId]: { ...prev[sectionId], freeform: editedContent }
        }));
      } else {
        setResponses(prev => ({
          ...prev,
          [sectionId]: editedContent
        }));
      }

      setEditLoading(false);
      setEditPrompt('');
      setEditingSection(null);
      alert('Content edited successfully!');
    } catch (error) {
      console.error('Edit error:', error);
      alert(`Error editing content: ${error.message}`);
      setEditLoading(false);
    }
  };

  const handleQuickEdit = (sectionId, action) => {
    let instruction = '';
    let wordLimit = null;
    let pageLimit = null;

    if (action === 'trim') {
      const limitType = prompt('Trim to word limit or page limit?\nEnter "w" for word limit or "p" for page limit:');
      if (!limitType) return;

      if (limitType.toLowerCase() === 'w') {
        const limit = prompt('Enter word limit (e.g., 500):');
        if (!limit) return;
        wordLimit = parseInt(limit);
        instruction = `Trim this content to ${wordLimit} words or fewer. Maintain the most important information and key points.`;
      } else if (limitType.toLowerCase() === 'p') {
        const limit = prompt('Enter page limit (e.g., 2 for 2 pages):');
        if (!limit) return;
        pageLimit = parseInt(limit);
        instruction = `Trim this content to fit within ${pageLimit} page(s). Maintain the most important information and key points.`;
      }
    } else if (action === 'shorten') {
      instruction = 'Make this content more concise while preserving all key information.';
    } else if (action === 'expand') {
      instruction = 'Expand this content with more details and examples.';
    } else if (action === 'more-specific') {
      instruction = 'Make this content more specific with concrete examples and details.';
    } else if (action === 'more-formal') {
      instruction = 'Make this content more formal and academic in tone.';
    }

    if (instruction) {
      editSectionContent(sectionId, instruction, wordLimit, pageLimit);
    }
  };

  const undoLastEdit = (sectionId) => {
    if (editHistory[sectionId] && editHistory[sectionId].length > 0) {
      const history = editHistory[sectionId];
      const lastEdit = history[history.length - 1];
      
      // Restore original content
      if (typeof responses[sectionId] === 'object' && responses[sectionId].freeform) {
        setResponses(prev => ({
          ...prev,
          [sectionId]: { ...prev[sectionId], freeform: lastEdit.original }
        }));
      } else {
        setResponses(prev => ({
          ...prev,
          [sectionId]: lastEdit.original
        }));
      }

      // Remove from history
      setEditHistory(prev => ({
        ...prev,
        [sectionId]: history.slice(0, -1)
      }));

      alert('Reverted to previous version!');
    }
  };

  const allInterests = [...defaultInterests, ...customInterests];

  if (!setupComplete) {
    return (
      <div className="app-container">
        <div className="app-content">
          <div className="header-section">
            <h1 className="main-title">
              Graduate Application Assistant
            </h1>
            <p className="subtitle">AI-powered application optimization powered by Claude</p>
          </div>

          <div className="form-card">
            <div className="form-section">
              <label className="form-label">Select Applicant</label>
              <select
                value={selectedApplicant}
                onChange={(e) => setSelectedApplicant(e.target.value)}
                className="select-input"
              >
                <option value="">Choose applicant...</option>
                {applicants.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div className="file-grid">
              {Object.entries({
                cv: 'Current CV',
                sop: 'Statement of Purpose',
                personalStatement: 'Personal Statement'
              }).map(([key, label]) => (
                <div key={key} className="file-upload-wrapper">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>{label}</label>
                    <button
                      onClick={() => setShowFileTextEditor(prev => ({ ...prev, [key]: !prev[key] }))}
                      className="toggle-editor-btn"
                      type="button"
                    >
                      {showFileTextEditor[key] ? 'Show Upload' : 'Paste Text'}
                    </button>
                  </div>
                  
                  {!showFileTextEditor[key] ? (
                    <div className="file-upload-box">
                      <input
                        type="file"
                        onChange={(e) => handleFileUpload(key, e)}
                        accept=".pdf,.doc,.docx,.txt"
                      />
                      <div className="file-upload-content">
                        <Upload className="upload-icon" size={24} />
                        <p className="upload-text">
                          {files[key] ? files[key].name : 'Click to upload'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <textarea
                        value={fileTexts[key]}
                        onChange={(e) => setFileTexts(prev => ({ ...prev, [key]: e.target.value }))}
                        placeholder={`Paste your ${label.toLowerCase()} text here... ${
                          key === 'sop' || key === 'personalStatement' 
                            ? 'You can paste LaTeX code or regular text.' 
                            : ''
                        }`}
                        className="file-text-editor"
                        rows={8}
                      />
                      {(key === 'sop' || key === 'personalStatement') && (
                        <label className="latex-checkbox-label">
                          <input
                            type="checkbox"
                            checked={isLatex[key]}
                            onChange={(e) => setIsLatex(prev => ({ ...prev, [key]: e.target.checked }))}
                            className="latex-checkbox"
                          />
                          <span>This is LaTeX code (Claude will output LaTeX)</span>
                        </label>
                      )}
                    </div>
                  )}
                  
                  {fileTexts[key] && fileTexts[key].length > 100 && (
                    <div className="text-saved-indicator">
                      ✓ Saved ({fileTexts[key].length} characters)
                    </div>
                  )}
                </div>
              ))}
              
              {/* Transcripts - file only */}
              <div className="file-upload-wrapper">
                <label className="form-label">Transcripts</label>
                <div className="file-upload-box">
                  <input
                    type="file"
                    onChange={(e) => handleFileUpload('transcripts', e)}
                    accept=".pdf,.doc,.docx,.txt"
                  />
                  <div className="file-upload-content">
                    <Upload className="upload-icon" size={24} />
                    <p className="upload-text">
                      {files.transcripts ? files.transcripts.name : 'Click to upload'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-section">
              <label className="form-label">College Name</label>
              <input
                type="text"
                value={programInfo.collegeName}
                onChange={(e) => setProgramInfo(prev => ({ ...prev, collegeName: e.target.value }))}
                placeholder="e.g., Stanford University"
                className="text-input"
              />
            </div>

            <div className="form-section">
              <label className="form-label">Program</label>
              <input
                type="text"
                value={programInfo.program}
                onChange={(e) => setProgramInfo(prev => ({ ...prev, program: e.target.value }))}
                placeholder="e.g., PhD in Electrical Engineering"
                className="text-input"
              />
            </div>

            <div className="form-section">
              <label className="form-label">Major/Concentration</label>
              <select
                value={programInfo.major}
                onChange={(e) => setProgramInfo(prev => ({ ...prev, major: e.target.value }))}
                className="select-input"
              >
                <option value="">Select major...</option>
                {majorOptions.map(major => (
                  <option key={major} value={major}>{major}</option>
                ))}
              </select>
            </div>

            <div className="form-section">
              <div className="interests-header">
                <label className="form-label" style={{marginBottom: 0}}>Research Interests</label>
                <button onClick={addCustomInterest} className="add-custom-btn">
                  + Add Custom
                </button>
              </div>
              <div className="interests-grid">
                {allInterests.map(interest => (
                  <button
                    key={interest}
                    onClick={() => {
                      const interests = programInfo.interests.includes(interest)
                        ? programInfo.interests.filter(i => i !== interest)
                        : [...programInfo.interests, interest];
                      setProgramInfo(prev => ({ ...prev, interests }));
                    }}
                    className={`interest-chip ${programInfo.interests.includes(interest) ? 'active' : 'inactive'}`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-section">
              <div className="sections-header">
                <h3 className="sections-title">Application Sections</h3>
                <button 
                  onClick={() => setShowSectionPicker(true)} 
                  className="add-section-btn"
                >
                  <Plus size={16} />
                  Add Section
                </button>
              </div>
              
              <div className="sections-list">
                {sections.map((section, index) => (
                  <div key={section.id} className="section-item">
                    <div className="section-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {index >= 3 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <button
                              onClick={() => moveSection(index, 'up')}
                              disabled={index === 3}
                              className="reorder-btn"
                              title="Move up"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => moveSection(index, 'down')}
                              disabled={index === sections.length - 1}
                              className="reorder-btn"
                              title="Move down"
                            >
                              ▼
                            </button>
                          </div>
                        )}
                        <span className="section-name">
                          {section.name}
                          {index < 3 && <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '0.5rem' }}>(Required)</span>}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {!['faculty', 'sop', 'admission-analysis'].includes(section.id) && (
                          <>
                            <button
                              onClick={() => setEditingSectionId(editingSectionId === section.id ? null : section.id)}
                              className="edit-content-btn"
                            >
                              {editingSectionId === section.id ? 'Hide' : 'Edit Content'}
                            </button>
                            <button
                              onClick={() => addQuestion(section.id)}
                              className="add-question-btn"
                            >
                              + Add Question
                            </button>
                          </>
                        )}
                        {index >= 3 && (
                          <button
                            onClick={() => removeSection(index)}
                            className="remove-section-btn"
                            title="Remove section"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {editingSectionId === section.id && (
                      <div className="freeform-editor">
                        <label className="freeform-label">
                          Paste entire application page content here (Claude will understand and generate responses):
                        </label>
                        <textarea
                          value={section.freeformContent || ''}
                          onChange={(e) => updateSectionContent(section.id, e.target.value)}
                          placeholder="Paste the entire application section here... Include all questions, prompts, instructions, and context. Claude will analyze and generate appropriate responses."
                          className="freeform-textarea"
                          rows={8}
                        />
                        <div className="freeform-hint">
                          💡 Tip: Copy-paste directly from the application portal. Claude can handle PDFs, HTML, or plain text format.
                        </div>
                      </div>
                    )}
                    
                    {section.questions.length > 0 && (
                      <ul className="question-list">
                        {section.questions.map((q, i) => (
                          <li key={i}>• {q}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={processApplication}
              disabled={loading}
              className="generate-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="spin" size={24} />
                  {processingStep}
                </>
              ) : (
                <>
                  <Search size={24} />
                  Generate AI-Powered Application
                </>
              )}
            </button>
          </div>
        </div>

        {showSectionPicker && (
          <div className="modal-overlay" onClick={() => setShowSectionPicker(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Add Section</h3>
                <button onClick={() => setShowSectionPicker(false)} className="modal-close">✕</button>
              </div>
              <div className="modal-body">
                <div className="section-templates">
                  {commonSectionTemplates
                    .filter(template => !sections.some(s => s.id === template.id))
                    .map(template => (
                      <button
                        key={template.id}
                        onClick={() => {
                          addSectionFromTemplate(template);
                          setShowSectionPicker(false);
                        }}
                        className="template-btn"
                      >
                        <div className="template-name">{template.name}</div>
                        {template.questions.length > 0 && (
                          <div className="template-questions">
                            {template.questions.length} default question{template.questions.length > 1 ? 's' : ''}
                          </div>
                        )}
                      </button>
                    ))}
                </div>
                <div className="custom-section-divider">
                  <span>or</span>
                </div>
                <button onClick={() => {
                  addCustomSection();
                  setShowSectionPicker(false);
                }} className="custom-section-btn">
                  <Plus size={16} />
                  Create Custom Section
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const currentSection = sections[currentPage];

  return (
    <div className="results-container">
      <div className="top-bar">
        <div className="top-bar-content">
          <div className="program-info">
            <h2>{programInfo.collegeName}</h2>
            <p>{programInfo.program} • {selectedApplicant}</p>
          </div>
          <button
            onClick={() => setSetupComplete(false)}
            className="change-settings-btn"
          >
            Change Settings
          </button>
        </div>
      </div>

      <div className="main-layout">
        <div className="sidebar">
          <h3 className="sidebar-title">Sections</h3>
          <nav className="sidebar-nav">
            {sections.map((section, index) => (
              <button
                key={section.id}
                onClick={() => setCurrentPage(index)}
                className={`nav-btn ${currentPage === index ? 'active' : 'inactive'}`}
              >
                {section.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="content-area">
          <div className="content-card">
            <div className="content-header">
              <h2 className="content-title">{currentSection.name}</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(currentSection.id === 'sop' || currentSection.id === 'personal') && responses[currentSection.id] && (
                  <>
                    <button
                      onClick={() => downloadDocument(responses[currentSection.id], `${currentSection.id}_revised.txt`)}
                      className="download-btn"
                      title="Download as TXT"
                    >
                      <Download size={16} />
                      TXT
                    </button>
                    <button
                      onClick={() => downloadAsDOCX(responses[currentSection.id], `${currentSection.id}_revised.docx`)}
                      className="download-btn"
                      title="Download as DOCX"
                    >
                      <Download size={16} />
                      DOCX
                    </button>
                    <button
                      onClick={() => downloadAsPDF(responses[currentSection.id], `${currentSection.id}_revised.pdf`)}
                      className="download-btn"
                      title="Download as PDF"
                    >
                      <Download size={16} />
                      PDF
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="content-body">
              {currentSection.id === 'faculty' && responses.faculty && (
                <>
                  <div 
                    className="response-text markdown-content"
                    dangerouslySetInnerHTML={{ __html: markdownToHTML(responses.faculty) }}
                  />
                  
                  {/* Edit Panel */}
                  <div className="edit-panel">
                    <div className="edit-panel-header">
                      <h4>✨ Edit with Claude</h4>
                      {editHistory.faculty && editHistory.faculty.length > 0 && (
                        <button onClick={() => undoLastEdit('faculty')} className="undo-btn">
                          ↶ Undo Last Edit
                        </button>
                      )}
                    </div>
                    
                    <div className="quick-actions">
                      <button onClick={() => handleQuickEdit('faculty', 'trim')} className="quick-action-btn">
                        ✂️ Trim
                      </button>
                      <button onClick={() => handleQuickEdit('faculty', 'shorten')} className="quick-action-btn">
                        📉 Shorten
                      </button>
                      <button onClick={() => handleQuickEdit('faculty', 'expand')} className="quick-action-btn">
                        📈 Expand
                      </button>
                      <button onClick={() => handleQuickEdit('faculty', 'more-specific')} className="quick-action-btn">
                        🎯 More Specific
                      </button>
                    </div>

                    <div className="custom-edit-box">
                      <textarea
                        value={editingSection === 'faculty' ? editPrompt : ''}
                        onChange={(e) => {
                          setEditingSection('faculty');
                          setEditPrompt(e.target.value);
                        }}
                        placeholder="Or type your own editing instruction... (e.g., 'Add more details about Dr. Smith's recent papers' or 'Rewrite focusing on ML applications')"
                        className="edit-prompt-input"
                        rows={3}
                        disabled={editLoading}
                      />
                      <button
                        onClick={() => {
                          if (editPrompt.trim()) {
                            editSectionContent('faculty', editPrompt);
                          }
                        }}
                        disabled={editLoading || !editPrompt.trim()}
                        className="submit-edit-btn"
                      >
                        {editLoading ? <><Loader2 className="spin" size={16} /> Editing...</> : '🚀 Apply Edit'}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {currentSection.id === 'sop' && responses.sop && (
                <div>
                  {responses.sopIsLatex ? (
                    <div>
                      <div className="latex-label">LaTeX Output (copy and paste into Overleaf):</div>
                      <textarea
                        value={responses.sop}
                        readOnly
                        className="latex-output-box"
                        rows={20}
                        onClick={(e) => e.target.select()}
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(responses.sop);
                          alert('LaTeX code copied to clipboard!');
                        }}
                        className="copy-latex-btn"
                      >
                        📋 Copy LaTeX Code
                      </button>
                    </div>
                  ) : (
                    <div 
                      className="response-text markdown-content"
                      dangerouslySetInnerHTML={{ __html: markdownToHTML(responses.sop) }}
                    />
                  )}

                  {/* Edit Panel */}
                  <div className="edit-panel">
                    <div className="edit-panel-header">
                      <h4>✨ Edit with Claude</h4>
                      {editHistory.sop && editHistory.sop.length > 0 && (
                        <button onClick={() => undoLastEdit('sop')} className="undo-btn">
                          ↶ Undo Last Edit
                        </button>
                      )}
                    </div>
                    
                    <div className="quick-actions">
                      <button onClick={() => handleQuickEdit('sop', 'trim')} className="quick-action-btn">
                        ✂️ Trim
                      </button>
                      <button onClick={() => handleQuickEdit('sop', 'shorten')} className="quick-action-btn">
                        📉 Shorten
                      </button>
                      <button onClick={() => handleQuickEdit('sop', 'expand')} className="quick-action-btn">
                        📈 Expand
                      </button>
                      <button onClick={() => handleQuickEdit('sop', 'more-specific')} className="quick-action-btn">
                        🎯 More Specific
                      </button>
                      <button onClick={() => handleQuickEdit('sop', 'more-formal')} className="quick-action-btn">
                        👔 More Formal
                      </button>
                    </div>

                    <div className="custom-edit-box">
                      <textarea
                        value={editingSection === 'sop' ? editPrompt : ''}
                        onChange={(e) => {
                          setEditingSection('sop');
                          setEditPrompt(e.target.value);
                        }}
                        placeholder="Or type your own editing instruction... (e.g., 'Emphasize my work with Professor Jones' or 'Add more about machine learning applications')"
                        className="edit-prompt-input"
                        rows={3}
                        disabled={editLoading}
                      />
                      <button
                        onClick={() => {
                          if (editPrompt.trim()) {
                            editSectionContent('sop', editPrompt);
                          }
                        }}
                        disabled={editLoading || !editPrompt.trim()}
                        className="submit-edit-btn"
                      >
                        {editLoading ? <><Loader2 className="spin" size={16} /> Editing...</> : '🚀 Apply Edit'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {currentSection.id === 'personal' && responses.personal && (
                <div>
                  {responses.personalIsLatex ? (
                    <div>
                      <div className="latex-label">LaTeX Output (copy and paste into Overleaf):</div>
                      <textarea
                        value={responses.personal}
                        readOnly
                        className="latex-output-box"
                        rows={20}
                        onClick={(e) => e.target.select()}
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(responses.personal);
                          alert('LaTeX code copied to clipboard!');
                        }}
                        className="copy-latex-btn"
                      >
                        📋 Copy LaTeX Code
                      </button>
                    </div>
                  ) : (
                    <div 
                      className="response-text markdown-content"
                      dangerouslySetInnerHTML={{ __html: markdownToHTML(responses.personal) }}
                    />
                  )}

                  {/* Edit Panel */}
                  <div className="edit-panel">
                    <div className="edit-panel-header">
                      <h4>✨ Edit with Claude</h4>
                      {editHistory.personal && editHistory.personal.length > 0 && (
                        <button onClick={() => undoLastEdit('personal')} className="undo-btn">
                          ↶ Undo Last Edit
                        </button>
                      )}
                    </div>
                    
                    <div className="quick-actions">
                      <button onClick={() => handleQuickEdit('personal', 'trim')} className="quick-action-btn">
                        ✂️ Trim
                      </button>
                      <button onClick={() => handleQuickEdit('personal', 'shorten')} className="quick-action-btn">
                        📉 Shorten
                      </button>
                      <button onClick={() => handleQuickEdit('personal', 'expand')} className="quick-action-btn">
                        📈 Expand
                      </button>
                      <button onClick={() => handleQuickEdit('personal', 'more-specific')} className="quick-action-btn">
                        🎯 More Specific
                      </button>
                    </div>

                    <div className="custom-edit-box">
                      <textarea
                        value={editingSection === 'personal' ? editPrompt : ''}
                        onChange={(e) => {
                          setEditingSection('personal');
                          setEditPrompt(e.target.value);
                        }}
                        placeholder="Or type your own editing instruction... (e.g., 'Make the opening more compelling' or 'Focus more on overcoming challenges')"
                        className="edit-prompt-input"
                        rows={3}
                        disabled={editLoading}
                      />
                      <button
                        onClick={() => {
                          if (editPrompt.trim()) {
                            editSectionContent('personal', editPrompt);
                          }
                        }}
                        disabled={editLoading || !editPrompt.trim()}
                        className="submit-edit-btn"
                      >
                        {editLoading ? <><Loader2 className="spin" size={16} /> Editing...</> : '🚀 Apply Edit'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {currentSection.id === 'admission-analysis' && responses['admission-analysis'] && (
                <>
                  <div className="admission-analysis-notice">
                    <strong>📊 Honest Assessment:</strong> This analysis provides realistic feedback based on your materials. Use it to strengthen your application, not as a definitive prediction.
                  </div>
                  
                  <div 
                    className="response-text markdown-content admission-analysis-content"
                    dangerouslySetInnerHTML={{ __html: markdownToHTML(responses['admission-analysis']) }}
                  />

                  {/* Edit Panel */}
                  <div className="edit-panel">
                    <div className="edit-panel-header">
                      <h4>✨ Edit with Claude</h4>
                      {editHistory['admission-analysis'] && editHistory['admission-analysis'].length > 0 && (
                        <button onClick={() => undoLastEdit('admission-analysis')} className="undo-btn">
                          ↶ Undo Last Edit
                        </button>
                      )}
                    </div>
                    
                    <div className="quick-actions">
                      <button onClick={() => handleQuickEdit('admission-analysis', 'expand')} className="quick-action-btn">
                        📈 More Detail
                      </button>
                      <button onClick={() => handleQuickEdit('admission-analysis', 'more-specific')} className="quick-action-btn">
                        🎯 More Specific Steps
                      </button>
                    </div>

                    <div className="custom-edit-box">
                      <textarea
                        value={editingSection === 'admission-analysis' ? editPrompt : ''}
                        onChange={(e) => {
                          setEditingSection('admission-analysis');
                          setEditPrompt(e.target.value);
                        }}
                        placeholder="Or type your own editing instruction... (e.g., 'Focus more on research fit' or 'Add more actionable steps for improving GPA')"
                        className="edit-prompt-input"
                        rows={3}
                        disabled={editLoading}
                      />
                      <button
                        onClick={() => {
                          if (editPrompt.trim()) {
                            editSectionContent('admission-analysis', editPrompt);
                          }
                        }}
                        disabled={editLoading || !editPrompt.trim()}
                        className="submit-edit-btn"
                      >
                        {editLoading ? <><Loader2 className="spin" size={16} /> Editing...</> : '🚀 Apply Edit'}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {!['faculty', 'sop', 'personal', 'admission-analysis'].includes(currentSection.id) && (
                <>
                  <div className="questions-section">
                    {responses[currentSection.id]?.freeform ? (
                      <div 
                        className="response-text markdown-content"
                        dangerouslySetInnerHTML={{ __html: markdownToHTML(responses[currentSection.id].freeform) }}
                      />
                    ) : (
                      currentSection.questions.map((question, i) => (
                        <div key={i} className="question-item">
                          <p className="question-text">{question}</p>
                          <div 
                            className="answer-text markdown-content"
                            dangerouslySetInnerHTML={{ 
                              __html: markdownToHTML(responses[currentSection.id]?.[question] || 'Processing...') 
                            }}
                          />
                        </div>
                      ))
                    )}
                  </div>

                  {/* Edit Panel for custom sections */}
                  <div className="edit-panel">
                    <div className="edit-panel-header">
                      <h4>✨ Edit with Claude</h4>
                      {editHistory[currentSection.id] && editHistory[currentSection.id].length > 0 && (
                        <button onClick={() => undoLastEdit(currentSection.id)} className="undo-btn">
                          ↶ Undo Last Edit
                        </button>
                      )}
                    </div>
                    
                    <div className="quick-actions">
                      <button onClick={() => handleQuickEdit(currentSection.id, 'trim')} className="quick-action-btn">
                        ✂️ Trim
                      </button>
                      <button onClick={() => handleQuickEdit(currentSection.id, 'shorten')} className="quick-action-btn">
                        📉 Shorten
                      </button>
                      <button onClick={() => handleQuickEdit(currentSection.id, 'expand')} className="quick-action-btn">
                        📈 Expand
                      </button>
                      <button onClick={() => handleQuickEdit(currentSection.id, 'more-specific')} className="quick-action-btn">
                        🎯 More Specific
                      </button>
                    </div>

                    <div className="custom-edit-box">
                      <textarea
                        value={editingSection === currentSection.id ? editPrompt : ''}
                        onChange={(e) => {
                          setEditingSection(currentSection.id);
                          setEditPrompt(e.target.value);
                        }}
                        placeholder="Or type your own editing instruction..."
                        className="edit-prompt-input"
                        rows={3}
                        disabled={editLoading}
                      />
                      <button
                        onClick={() => {
                          if (editPrompt.trim()) {
                            editSectionContent(currentSection.id, editPrompt);
                          }
                        }}
                        disabled={editLoading || !editPrompt.trim()}
                        className="submit-edit-btn"
                      >
                        {editLoading ? <><Loader2 className="spin" size={16} /> Editing...</> : '🚀 Apply Edit'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="navigation">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="nav-button prev"
            >
              <ChevronLeft size={20} />
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(sections.length - 1, p + 1))}
              disabled={currentPage === sections.length - 1}
              className="nav-button next"
            >
              Next
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradApplicationAssistant;