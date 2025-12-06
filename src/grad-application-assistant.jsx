import React, { useState, useEffect } from 'react';
import { FileText, Upload, Plus, ChevronRight, ChevronLeft, Loader2, X, GripVertical, Save, FolderOpen } from 'lucide-react';
import './GradApp.css';

const GradApplicationAssistant = () => {
  const [currentPage, setCurrentPage] = useState('setup');
  const [selectedApplicant, setSelectedApplicant] = useState('');
  const [files, setFiles] = useState({ cv: null, sop: null, personalStatement: null, transcript: null });
  const [programInfo, setProgramInfo] = useState({
    collegeName: '',
    program: '',
    major: '',
    interests: []
  });
  
  const defaultSections = [
    { id: 'faculty', name: 'Faculty Matches', questions: [] },
    { id: 'sop', name: 'Statement of Purpose', questions: [] },
    { id: 'admission-analysis', name: 'Admission Analysis', questions: [] }
  ];
  
  const [sections, setSections] = useState(defaultSections);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState(null);
  
  // File text storage (extracted or pasted)
  const [fileTexts, setFileTexts] = useState({
    cv: '',
    sop: '',
    personalStatement: ''
  });
  
  // Text editor toggle
  const [showFileTextEditor, setShowFileTextEditor] = useState({
    cv: false,
    sop: false,
    personalStatement: false
  });
  
  // LaTeX mode
  const [isLatex, setIsLatex] = useState({
    sop: false,
    personalStatement: false
  });
  
  // Editing state
  const [editingSection, setEditingSection] = useState(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editHistory, setEditHistory] = useState({});
  
  // Saved data check
  const [hasSavedData, setHasSavedData] = useState(false);
  const [savedDataInfo, setSavedDataInfo] = useState(null);

  const applicants = ['Enter Your Name Here In the Code', 'Anonymous'];
  
  const researchInterests = [
    'Machine Learning', 'Natural Language Processing', 'Computer Vision',
    'Robotics', 'Human-Computer Interaction', 'Systems', 'Theory',
    'Security', 'Graphics', 'Databases', 'Networks', 'AI Safety',
    'Reinforcement Learning', 'Speech Recognition', 'Computational Biology'
  ];

  const sectionTemplates = [
    { id: 'personal', name: 'Personal Statement', questions: [] },
    { id: 'research', name: 'Research Experience', questions: ['Describe your research experience', 'What methodologies have you used?'] },
    { id: 'teaching', name: 'Teaching Experience', questions: ['Describe any teaching or mentoring experience'] },
    { id: 'diversity', name: 'Diversity Statement', questions: ['How will you contribute to diversity?'] },
    { id: 'leadership', name: 'Leadership Experience', questions: ['Describe leadership roles you have held'] },
    { id: 'publications', name: 'Publications & Presentations', questions: ['List your publications and presentations'] },
    { id: 'awards', name: 'Awards & Honors', questions: ['List any awards or honors'] },
    { id: 'goals', name: 'Career Goals', questions: ['What are your short-term and long-term career goals?'] }
  ];

  const [customInterests, setCustomInterests] = useState([]);
  const [allUsedSectionNames, setAllUsedSectionNames] = useState([]);

  // Generate storage key for applicant + school combo
  const getStorageKey = (applicant, school) => {
    if (!applicant || !school) return null;
    const sanitizedApplicant = applicant.replace(/\s+/g, '_');
    const sanitizedSchool = school.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    return `app_${sanitizedApplicant}_${sanitizedSchool}`;
  };

  // Check if saved data exists for current applicant + school
  const checkForSavedData = () => {
    const key = getStorageKey(selectedApplicant, programInfo.collegeName);
    if (!key) {
      setHasSavedData(false);
      setSavedDataInfo(null);
      return;
    }
    
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setHasSavedData(true);
        setSavedDataInfo({
          savedAt: data.savedAt,
          sectionsCount: Object.keys(data.responses || {}).length
        });
      } catch (e) {
        setHasSavedData(false);
        setSavedDataInfo(null);
      }
    } else {
      setHasSavedData(false);
      setSavedDataInfo(null);
    }
  };

  // Load saved data for applicant + school
  const loadSavedData = () => {
    const key = getStorageKey(selectedApplicant, programInfo.collegeName);
    if (!key) return;
    
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setResponses(data.responses || {});
        setFileTexts(data.fileTexts || { cv: '', sop: '', personalStatement: '' });
        setSections(data.sections || defaultSections);
        setCurrentPage('results');
        setCurrentSectionIndex(0);
        alert(`Loaded saved application for ${programInfo.collegeName}!`);
      } catch (e) {
        alert('Error loading saved data');
      }
    }
  };

  // Save data for applicant + school
  const saveApplicationData = (newResponses, newFileTexts, newSections) => {
    const key = getStorageKey(selectedApplicant, programInfo.collegeName);
    if (!key) return;
    
    const data = {
      applicant: selectedApplicant,
      collegeName: programInfo.collegeName,
      program: programInfo.program,
      major: programInfo.major,
      interests: programInfo.interests,
      responses: newResponses,
      fileTexts: newFileTexts,
      sections: newSections,
      savedAt: new Date().toISOString()
    };
    
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`Saved to ${key}`);
  };

  // Check for saved data when applicant or school changes
  useEffect(() => {
    checkForSavedData();
  }, [selectedApplicant, programInfo.collegeName]);

  // Load applicant-specific data
  useEffect(() => {
    if (selectedApplicant) {
      const savedApplicantData = localStorage.getItem(`applicant_${selectedApplicant.replace(/\s+/g, '_')}`);
      if (savedApplicantData) {
        try {
          const data = JSON.parse(savedApplicantData);
          setSections(data.sections || defaultSections);
          setProgramInfo(data.programInfo || { collegeName: '', program: '', major: '', interests: [] });
          setFileTexts(data.fileTexts || { cv: '', sop: '', personalStatement: '' });
        } catch (e) {
          console.error('Error loading applicant data:', e);
        }
      } else {
        setSections(defaultSections);
        setProgramInfo({ collegeName: '', program: '', major: '', interests: [] });
        setFileTexts({ cv: '', sop: '', personalStatement: '' });
      }
    }
  }, [selectedApplicant]);

  // Save applicant data when it changes
  useEffect(() => {
    if (selectedApplicant && (sections.length > 0 || programInfo.collegeName)) {
      const dataToSave = {
        sections,
        programInfo,
        fileTexts
      };
      localStorage.setItem(`applicant_${selectedApplicant.replace(/\s+/g, '_')}`, JSON.stringify(dataToSave));
    }
  }, [selectedApplicant, sections, programInfo, fileTexts]);

  // Load custom interests from localStorage
  useEffect(() => {
    const savedCustomInterests = localStorage.getItem('customInterests');
    if (savedCustomInterests) {
      setCustomInterests(JSON.parse(savedCustomInterests));
    }
    
    const savedSectionNames = localStorage.getItem('allUsedSectionNames');
    if (savedSectionNames) {
      setAllUsedSectionNames(JSON.parse(savedSectionNames));
    }
  }, []);

  const handleFileUpload = (type, file) => {
    setFiles(prev => ({ ...prev, [type]: file }));
  };

  const toggleInterest = (interest) => {
    setProgramInfo(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const addCustomInterest = () => {
    const interest = prompt('Enter custom research interest:');
    if (interest && interest.trim()) {
      const trimmedInterest = interest.trim();
      if (!customInterests.includes(trimmedInterest) && !researchInterests.includes(trimmedInterest)) {
        const newCustomInterests = [...customInterests, trimmedInterest];
        setCustomInterests(newCustomInterests);
        localStorage.setItem('customInterests', JSON.stringify(newCustomInterests));
      }
      setProgramInfo(prev => ({
        ...prev,
        interests: prev.interests.includes(trimmedInterest)
          ? prev.interests
          : [...prev.interests, trimmedInterest]
      }));
    }
  };

  const addSection = (template) => {
    const newSection = {
      ...template,
      id: template.id === 'custom' ? `custom-${Date.now()}` : template.id,
      questions: [...(template.questions || [])]
    };
    setSections(prev => [...prev, newSection]);
    
    if (!allUsedSectionNames.find(s => s.id === newSection.id)) {
      const newAllUsed = [...allUsedSectionNames, { id: newSection.id, name: newSection.name }];
      setAllUsedSectionNames(newAllUsed);
      localStorage.setItem('allUsedSectionNames', JSON.stringify(newAllUsed));
    }
    
    setShowSectionModal(false);
  };

  const addCustomSection = () => {
    const name = prompt('Enter section name:');
    if (name && name.trim()) {
      const newSection = {
        id: `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        name: name.trim(),
        questions: []
      };
      setSections(prev => [...prev, newSection]);
      
      const newAllUsed = [...allUsedSectionNames, { id: newSection.id, name: newSection.name }];
      setAllUsedSectionNames(newAllUsed);
      localStorage.setItem('allUsedSectionNames', JSON.stringify(newAllUsed));
      
      setShowSectionModal(false);
    }
  };

  const addQuestion = (sectionId) => {
    const question = prompt('Enter your question:');
    if (question && question.trim()) {
      setSections(prev => prev.map(section => 
        section.id === sectionId
          ? { ...section, questions: [...section.questions, question.trim()] }
          : section
      ));
    }
  };

  const removeQuestion = (sectionId, questionIndex) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? { ...section, questions: section.questions.filter((_, i) => i !== questionIndex) }
        : section
    ));
  };

  const moveSection = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Protect first 3 sections (Faculty, SoP, Admission Analysis)
    if (index < 3 || newIndex < 3 || newIndex >= sections.length) return;
    
    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    
    setSections(updated);
  };

  const removeSection = (index) => {
    if (index < 3) return; // Protect first 3 sections
    
    const updated = sections.filter((_, i) => i !== index);
    setSections(updated);
  };

  const updateSectionFreeformContent = (sectionId, content) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? { ...section, freeformContent: content }
        : section
    ));
  };

  // Read file as base64
  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        const mimeType = file.type || 'application/pdf';
        resolve({ data: base64, mimeType });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Claude API call with document support
  const callClaudeAPI = async (prompt, systemPrompt = '', documents = [], useOpus = false) => {
    try {
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

      const model = useOpus ? 'claude-opus-4-20250514' : 'claude-sonnet-4-20250514';
      const maxTokens = useOpus ? 16000 : 8000;

      const response = await fetch('http://localhost:3001/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: [{ role: 'user', content: content }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText.substring(0, 200)}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'API returned an error');
      }
      
      return data.content[0].text;
    } catch (error) {
      console.error('Claude API Error:', error);
      throw error;
    }
  };

  // Improved Markdown to HTML converter
  const markdownToHTML = (text) => {
    if (!text) return '';
    
    // Log the original text for debugging
    console.log('Converting markdown:', text.substring(0, 200));
    
    let html = text
      // Headers
      .replace(/^##### (.*$)/gim, '<h5>$1</h5>')
      .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold and italic
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // Line breaks and paragraphs
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br/>');
    
    html = '<p>' + html + '</p>';
    html = html.replace(/<p><h([1-5])>/g, '<h$1>').replace(/<\/h([1-5])><\/p>/g, '</h$1>');
    
    console.log('Converted HTML:', html.substring(0, 200));
    
    return html;
  };

  // Download functions
  const downloadDocument = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAsDOCX = async (content, filename) => {
    const docContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${content.split('\n').map(para => `<w:p><w:r><w:t>${para.replace(/[<>&'"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;'}[c]))}</w:t></w:r></w:p>`).join('')}
  </w:body>
</w:document>`;
    
    const blob = new Blob([docContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAsPDF = async (content, filename) => {
    alert('PDF generation requires additional setup. Downloading as TXT for now.\n\nYou can:\n1. Copy the content\n2. Paste into Google Docs\n3. Download as PDF from there');
    downloadDocument(content, filename.replace('.pdf', '.txt'));
  };

  // Edit section content
  const editSectionContent = async (sectionId, editInstruction, wordLimit = null, pageLimit = null) => {
    setEditLoading(true);
    
    try {
      const currentContent = responses[sectionId];
      const contentToEdit = typeof currentContent === 'object' && currentContent.freeform 
        ? currentContent.freeform 
        : currentContent;

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

      if (!editHistory[sectionId]) {
        editHistory[sectionId] = [];
      }
      editHistory[sectionId].push({
        original: contentToEdit,
        edited: editedContent,
        instruction: editInstruction,
        timestamp: new Date().toISOString()
      });

      let newResponses;
      if (typeof responses[sectionId] === 'object' && responses[sectionId].freeform) {
        newResponses = {
          ...responses,
          [sectionId]: { ...responses[sectionId], freeform: editedContent }
        };
      } else {
        newResponses = {
          ...responses,
          [sectionId]: editedContent
        };
      }
      
      setResponses(newResponses);
      saveApplicationData(newResponses, fileTexts, sections);

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
      
      let newResponses;
      if (typeof responses[sectionId] === 'object' && responses[sectionId].freeform) {
        newResponses = {
          ...responses,
          [sectionId]: { ...responses[sectionId], freeform: lastEdit.original }
        };
      } else {
        newResponses = {
          ...responses,
          [sectionId]: lastEdit.original
        };
      }
      
      setResponses(newResponses);
      setEditHistory(prev => ({
        ...prev,
        [sectionId]: history.slice(0, -1)
      }));

      alert('Reverted to previous version!');
    }
  };

  // Main processing function with smart generation
  const processApplication = async () => {
    setLoading(true);
    setProcessingStep('Initializing...');
    
    try {
      // Check for existing saved data
      const storageKey = getStorageKey(selectedApplicant, programInfo.collegeName);
      let existingData = {};
      if (storageKey) {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          try {
            existingData = JSON.parse(saved).responses || {};
          } catch (e) {}
        }
      }

      // Prepare documents array for API calls
      const documents = [];
      
      // Extract text from files or use saved text
      let cvText = fileTexts.cv;
      let sopText = fileTexts.sop;
      let psText = fileTexts.personalStatement;

      // Process CV
      if (files.cv && !cvText) {
        setProcessingStep('Reading CV...');
        const cvDoc = await readFileAsBase64(files.cv);
        documents.push(cvDoc);
        
        const extractedCV = await callClaudeAPI(
          'Extract and summarize the key information from this CV/resume. Include education, research experience, publications, skills, and any other relevant information.',
          'You are extracting information from academic documents. Be thorough and accurate.'
        , [cvDoc]);
        
        cvText = extractedCV;
        setFileTexts(prev => ({ ...prev, cv: cvText }));
      }

      // Process SoP
      if (files.sop && !sopText) {
        setProcessingStep('Reading Statement of Purpose...');
        const sopDoc = await readFileAsBase64(files.sop);
        
        const extractedSoP = await callClaudeAPI(
          'Extract the complete text from this Statement of Purpose document. Preserve all content exactly.',
          'You are extracting text from documents. Preserve the original content exactly.'
        , [sopDoc]);
        
        sopText = extractedSoP;
        setFileTexts(prev => ({ ...prev, sop: sopText }));
      }

      // Process Personal Statement
      if (files.personalStatement && !psText) {
        setProcessingStep('Reading Personal Statement...');
        const psDoc = await readFileAsBase64(files.personalStatement);
        
        const extractedPS = await callClaudeAPI(
          'Extract the complete text from this Personal Statement document. Preserve all content exactly.',
          'You are extracting text from documents. Preserve the original content exactly.'
        , [psDoc]);
        
        psText = extractedPS;
        setFileTexts(prev => ({ ...prev, personalStatement: psText }));
      }

      // Validate we have required content
      if (!cvText) {
        throw new Error('Could not extract CV text. Please paste your CV text manually.');
      }
      if (!sopText) {
        throw new Error('Could not extract SoP text. Please paste your SoP text manually.');
      }

      // Build comprehensive context for all API calls
      const fullContext = `
APPLICANT PROFILE:
Name: ${selectedApplicant}
Target Program: ${programInfo.program}
Target Institution: ${programInfo.collegeName}
Major/Concentration: ${programInfo.major}
Research Interests: ${programInfo.interests.join(', ')}

COMPLETE CV:
${cvText}

STATEMENT OF PURPOSE:
${sopText}

${psText ? `PERSONAL STATEMENT:\n${psText}` : ''}
`;

      let newResponses = { ...existingData };

      // Generate Faculty Matches (skip if exists and unchanged)
      if (!existingData.faculty) {
        setProcessingStep('Finding faculty matches...');
        const facultyPrompt = `${fullContext}

Based on this applicant's profile, identify the top 5-7 faculty members at ${programInfo.collegeName} who would be excellent research mentors. For each faculty member, provide:

1. Name and title
2. Research areas
3. Why they're a good match (be specific about alignment)
4. Recent notable work
5. Fit score (1-10)

Focus on faculty in ${programInfo.major || 'Computer Science'} and related departments. Prioritize faculty whose work aligns with: ${programInfo.interests.join(', ')}.`;

        const facultyMatches = await callClaudeAPI(
          facultyPrompt,
          'You are an expert at matching graduate applicants with faculty mentors. Be specific about research alignment. CRITICAL: Never use em dashes. Minimize colon usage.'
        );

        newResponses.faculty = facultyMatches;
      } else {
        setProcessingStep('Using cached faculty matches...');
      }

      // Generate SoP Revision (skip if exists and unchanged)
      if (!existingData.sop) {
        setProcessingStep('Revising Statement of Purpose...');
        
        const sopIsLatex = sopText.includes('\\documentclass') || 
                          sopText.includes('\\begin{document}') || 
                          isLatex.sop;
        
        const latexInstructions = sopIsLatex 
          ? 'The original statement is in LaTeX format. Maintain LaTeX formatting in your response.'
          : '';
        
        const revisedSOP = await callClaudeAPI(
          `${fullContext}

FACULTY TO MENTION (from analysis):
${newResponses.faculty ? newResponses.faculty.substring(0, 2000) : 'Focus on faculty in ' + programInfo.interests.join(', ')}

Revise the Statement of Purpose to:
1. Strengthen alignment with ${programInfo.collegeName}'s ${programInfo.program} program
2. Naturally mention 2-3 faculty members and their research
3. Maintain the applicant's authentic voice
4. Be specific about research goals and fit

${latexInstructions}

Provide the complete revised Statement of Purpose.`,
          `You are an expert at crafting graduate school statements. Maintain authenticity while demonstrating specific program knowledge. CRITICAL: Never use em dashes. Minimize colon usage. Match the writing style and tone of the original. ${latexInstructions}`,
          [],
          true // Use Opus for complex revision
        );

        newResponses.sop = revisedSOP;
        newResponses.sopIsLatex = sopIsLatex;
      } else {
        setProcessingStep('Using cached SoP revision...');
      }

      // Process Personal Statement section if it exists
      const hasPersonalSection = sections.some(s => s.id === 'personal');
      if (hasPersonalSection && psText && !existingData.personal) {
        setProcessingStep('Revising Personal Statement...');
        
        const personalIsLatex = psText.includes('\\documentclass') || 
                               psText.includes('\\begin{document}') || 
                               isLatex.personalStatement;
        
        const latexInstructions = personalIsLatex
          ? 'The original statement is in LaTeX format. Maintain LaTeX formatting in your response.'
          : '';
        
        const revisedPersonal = await callClaudeAPI(
          `${fullContext}

Revise this Personal Statement to strengthen the narrative while maintaining the applicant's authentic voice. Focus on:
1. Compelling personal story
2. Growth and resilience
3. Connection to graduate school goals
4. What makes this applicant unique

${latexInstructions}

Provide the complete revised Personal Statement.`,
          `You are an expert at personal narrative writing. Maintain a warm, authentic, personal tone. CRITICAL: Never use em dashes. Minimize colon usage. ${latexInstructions}`
        );

        newResponses.personal = revisedPersonal;
        newResponses.personalIsLatex = personalIsLatex;
      } else if (existingData.personal) {
        setProcessingStep('Using cached Personal Statement...');
      }

      // Process additional sections with FULL CONTEXT
      setProcessingStep('Answering application questions...');
      for (const section of sections) {
        // Skip core sections we've already handled
        if (['faculty', 'sop', 'personal', 'admission-analysis'].includes(section.id)) continue;
        
        // Skip if we already have this section cached
        if (existingData[section.id]) {
          setProcessingStep(`Using cached ${section.name}...`);
          newResponses[section.id] = existingData[section.id];
          continue;
        }

        setProcessingStep(`Processing ${section.name}...`);

        // Check for freeform content
        if (section.freeformContent && section.freeformContent.trim()) {
          const personalKeywords = ['diversity', 'community', 'background', 'culture', 'personal', 'identity', 'experience', 'challenges', 'overcome', 'perspective', 'contribute'];
          const isPersonalSection = personalKeywords.some(keyword => 
            section.freeformContent.toLowerCase().includes(keyword) || section.name.toLowerCase().includes(keyword)
          );
          
          const toneReference = isPersonalSection 
            ? 'Match the personal, authentic tone of the personal statement.'
            : 'Match the formal, academic tone of the statement of purpose.';

          const sectionResponse = await callClaudeAPI(
            `${fullContext}

APPLICATION SECTION: ${section.name}
SECTION CONTENT/QUESTIONS:
${section.freeformContent}

Based on the applicant's complete profile above, provide comprehensive responses to all questions or prompts in this section. Structure your response clearly if there are multiple questions.

${toneReference}`,
            `You are answering graduate application questions. Be specific, genuine, and demonstrate clear alignment with the program. Use examples from the CV and statements. CRITICAL: Never use em dashes. Minimize colon usage. ${toneReference}`
          );

          newResponses[section.id] = { freeform: sectionResponse };
        }
        // Process individual questions
        else if (section.questions && section.questions.length > 0) {
          const sectionResponses = {};
          
          for (const question of section.questions) {
            const personalKeywords = ['diversity', 'community', 'background', 'culture', 'personal', 'identity', 'experience', 'challenges', 'overcome', 'perspective', 'contribute'];
            const isPersonalQuestion = personalKeywords.some(keyword => 
              question.toLowerCase().includes(keyword)
            );
            
            const toneReference = isPersonalQuestion 
              ? 'Match the personal, authentic tone of a personal statement.'
              : 'Match the formal, academic tone of a statement of purpose.';

            const answer = await callClaudeAPI(
              `${fullContext}

QUESTION: ${question}

Provide a compelling 200-300 word response that:
1. Demonstrates fit with ${programInfo.collegeName}
2. Uses specific examples from the CV
3. Shows authenticity and genuine interest

${toneReference}`,
              `You are answering graduate application questions. Be specific and use concrete examples from the applicant's background. CRITICAL: Never use em dashes. Minimize colon usage. ${toneReference}`
            );

            sectionResponses[question] = answer;
          }

          newResponses[section.id] = sectionResponses;
        }
      }

      // Generate Admission Analysis (always regenerate to be current)
      setProcessingStep('Analyzing admission chances...');
      const admissionAnalysisPrompt = `${fullContext}

REVISED STATEMENT OF PURPOSE:
${newResponses.sop}

FACULTY ALIGNMENT:
${newResponses.faculty}

You are an expert graduate admissions consultant. Analyze this applicant's chances of admission to ${programInfo.collegeName}'s ${programInfo.program} program.

Provide a comprehensive analysis with these sections:

## Admission Chances Estimate
- Realistic percentage range (e.g., 60-75%)
- Rating: Very Strong / Strong / Competitive / Moderate / Reach
- Brief justification (2-3 sentences)

## Key Strengths (3-5 points)
What makes this applicant stand out? Be specific with examples from their materials.

## Potential Weaknesses (2-4 points)
Be honest and constructive. What might concern the admissions committee?

## Program Fit Analysis
How well does the applicant align with this specific program's research areas, faculty, and culture?

## Actionable Steps to Strengthen Application (5-8 steps)
Concrete, specific actions they can take NOW. Prioritize by impact. Include timelines.

## Red Flags to Address (if any)
Critical issues that must be addressed in the application.

## Final Recommendation
Should they apply? As reach/target/safety? Alternative strategies?

Be honest, specific, and actionable.`;

      const admissionAnalysis = await callClaudeAPI(
        admissionAnalysisPrompt,
        'You are an expert graduate admissions consultant. Provide honest, data-driven, actionable advice. CRITICAL: Never use em dashes. Minimize colon usage. Use markdown with ## for headers and **bold** for emphasis.',
        [],
        true // Use Opus for comprehensive analysis
      );

      newResponses['admission-analysis'] = admissionAnalysis;
      
      // Debug log
      console.log('Admission Analysis generated:', admissionAnalysis.substring(0, 500));

      // Save everything
      setResponses(newResponses);
      saveApplicationData(newResponses, fileTexts, sections);
      
      setCurrentPage('results');
      setCurrentSectionIndex(0);
      setLoading(false);
      
    } catch (error) {
      console.error('Processing error:', error);
      alert(`Error: ${error.message}`);
      setLoading(false);
    }
  };

  const currentSection = sections[currentSectionIndex];

  // Render Edit Panel component
  const renderEditPanel = (sectionId) => (
    <div className="edit-panel">
      <div className="edit-panel-header">
        <h4>✨ Edit with Claude</h4>
        {editHistory[sectionId] && editHistory[sectionId].length > 0 && (
          <button onClick={() => undoLastEdit(sectionId)} className="undo-btn">
            ↶ Undo Last Edit
          </button>
        )}
      </div>
      
      <div className="quick-actions">
        <button onClick={() => handleQuickEdit(sectionId, 'trim')} className="quick-action-btn">
          ✂️ Trim
        </button>
        <button onClick={() => handleQuickEdit(sectionId, 'shorten')} className="quick-action-btn">
          📉 Shorten
        </button>
        <button onClick={() => handleQuickEdit(sectionId, 'expand')} className="quick-action-btn">
          📈 Expand
        </button>
        <button onClick={() => handleQuickEdit(sectionId, 'more-specific')} className="quick-action-btn">
          🎯 More Specific
        </button>
        {sectionId === 'sop' && (
          <button onClick={() => handleQuickEdit(sectionId, 'more-formal')} className="quick-action-btn">
            👔 More Formal
          </button>
        )}
      </div>

      <div className="custom-edit-box">
        <textarea
          value={editingSection === sectionId ? editPrompt : ''}
          onChange={(e) => {
            setEditingSection(sectionId);
            setEditPrompt(e.target.value);
          }}
          placeholder="Type your editing instruction... (e.g., 'Add more about my research' or 'Focus on machine learning')"
          className="edit-prompt-input"
          rows={3}
          disabled={editLoading}
        />
        <button
          onClick={() => {
            if (editPrompt.trim()) {
              editSectionContent(sectionId, editPrompt);
            }
          }}
          disabled={editLoading || !editPrompt.trim()}
          className="submit-edit-btn"
        >
          {editLoading ? <><Loader2 className="spin" size={16} /> Editing...</> : '🚀 Apply Edit'}
        </button>
      </div>
    </div>
  );

  // SETUP PAGE (with corrected class names)
  if (currentPage === 'setup') {
    return (
      <div className="app-container">
        <div className="app-content">
          <div className="header-section">
            <h1 className="main-title">Graduate Application Assistant</h1>
            <p className="subtitle">AI-powered application optimization</p>
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

            {selectedApplicant && (
              <>
                <div className="form-section">
                  <label className="form-label">Application Materials</label>
                  <div className="file-grid">
                    {/* CV Upload */}
                    <div className="file-upload-wrapper">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 600 }}>CV / Resume *</span>
                        <button 
                          onClick={() => setShowFileTextEditor(prev => ({ ...prev, cv: !prev.cv }))}
                          className="toggle-editor-btn"
                        >
                          {showFileTextEditor.cv ? 'Upload File' : 'Paste Text'}
                        </button>
                      </div>
                      {showFileTextEditor.cv ? (
                        <div>
                          <textarea
                            value={fileTexts.cv}
                            onChange={(e) => setFileTexts(prev => ({ ...prev, cv: e.target.value }))}
                            placeholder="Paste your CV text here..."
                            rows={8}
                            className="file-text-editor"
                          />
                          <div className="text-saved-indicator">
                            {fileTexts.cv ? `${fileTexts.cv.length} characters` : 'No text entered'}
                          </div>
                        </div>
                      ) : (
                        <div className="file-upload-box">
                          <input
                            type="file"
                            onChange={(e) => handleFileUpload('cv', e.target.files[0])}
                            accept=".pdf,.doc,.docx,.txt"
                          />
                          <div className="file-upload-content">
                            <div className="upload-icon"><Upload size={32} /></div>
                            <div className="upload-text">{files.cv ? files.cv.name : 'Upload CV'}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* SoP Upload */}
                    <div className="file-upload-wrapper">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 600 }}>Statement of Purpose *</span>
                        <button 
                          onClick={() => setShowFileTextEditor(prev => ({ ...prev, sop: !prev.sop }))}
                          className="toggle-editor-btn"
                        >
                          {showFileTextEditor.sop ? 'Upload File' : 'Paste Text'}
                        </button>
                      </div>
                      {showFileTextEditor.sop ? (
                        <div>
                          <textarea
                            value={fileTexts.sop}
                            onChange={(e) => setFileTexts(prev => ({ ...prev, sop: e.target.value }))}
                            placeholder="Paste your Statement of Purpose text here..."
                            rows={8}
                            className="file-text-editor"
                          />
                          <div className="text-saved-indicator">
                            {fileTexts.sop ? `${fileTexts.sop.length} characters` : 'No text entered'}
                          </div>
                        </div>
                      ) : (
                        <div className="file-upload-box">
                          <input
                            type="file"
                            onChange={(e) => handleFileUpload('sop', e.target.files[0])}
                            accept=".pdf,.doc,.docx,.txt"
                          />
                          <div className="file-upload-content">
                            <div className="upload-icon"><Upload size={32} /></div>
                            <div className="upload-text">{files.sop ? files.sop.name : 'Upload SoP'}</div>
                          </div>
                        </div>
                      )}
                      <label className="latex-checkbox-label">
                        <input
                          type="checkbox"
                          checked={isLatex.sop}
                          onChange={(e) => setIsLatex(prev => ({ ...prev, sop: e.target.checked }))}
                          className="latex-checkbox"
                        />
                        This is LaTeX code
                      </label>
                    </div>

                    {/* Personal Statement Upload */}
                    <div className="file-upload-wrapper">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 600 }}>Personal Statement</span>
                        <button 
                          onClick={() => setShowFileTextEditor(prev => ({ ...prev, personalStatement: !prev.personalStatement }))}
                          className="toggle-editor-btn"
                        >
                          {showFileTextEditor.personalStatement ? 'Upload File' : 'Paste Text'}
                        </button>
                      </div>
                      {showFileTextEditor.personalStatement ? (
                        <div>
                          <textarea
                            value={fileTexts.personalStatement}
                            onChange={(e) => setFileTexts(prev => ({ ...prev, personalStatement: e.target.value }))}
                            placeholder="Paste your Personal Statement text here..."
                            rows={8}
                            className="file-text-editor"
                          />
                          <div className="text-saved-indicator">
                            {fileTexts.personalStatement ? `${fileTexts.personalStatement.length} characters` : 'No text entered'}
                          </div>
                        </div>
                      ) : (
                        <div className="file-upload-box">
                          <input
                            type="file"
                            onChange={(e) => handleFileUpload('personalStatement', e.target.files[0])}
                            accept=".pdf,.doc,.docx,.txt"
                          />
                          <div className="file-upload-content">
                            <div className="upload-icon"><Upload size={32} /></div>
                            <div className="upload-text">{files.personalStatement ? files.personalStatement.name : 'Upload (Optional)'}</div>
                          </div>
                        </div>
                      )}
                      <label className="latex-checkbox-label">
                        <input
                          type="checkbox"
                          checked={isLatex.personalStatement}
                          onChange={(e) => setIsLatex(prev => ({ ...prev, personalStatement: e.target.checked }))}
                          className="latex-checkbox"
                        />
                        This is LaTeX code
                      </label>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <label className="form-label">Program Information</label>
                  <div className="input-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label className="form-label">College/University *</label>
                      <input
                        type="text"
                        value={programInfo.collegeName}
                        onChange={(e) => setProgramInfo(prev => ({ ...prev, collegeName: e.target.value }))}
                        placeholder="e.g., Stanford University"
                        className="text-input"
                      />
                    </div>
                    <div>
                      <label className="form-label">Program *</label>
                      <input
                        type="text"
                        value={programInfo.program}
                        onChange={(e) => setProgramInfo(prev => ({ ...prev, program: e.target.value }))}
                        placeholder="e.g., PhD in Computer Science"
                        className="text-input"
                      />
                    </div>
                    <div>
                      <label className="form-label">Major/Concentration</label>
                      <select
                        value={programInfo.major}
                        onChange={(e) => setProgramInfo(prev => ({ ...prev, major: e.target.value }))}
                        className="select-input"
                      >
                        <option value="">Select major...</option>
                        <option value="Electrical Engineering">Electrical Engineering</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Computer Engineering">Computer Engineering</option>
                        <option value="Data Science">Data Science</option>
                        <option value="Machine Learning">Machine Learning</option>
                        <option value="Artificial Intelligence">Artificial Intelligence</option>
                        <option value="Robotics">Robotics</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginTop: '1.5rem' }}>
                    <div className="interests-header">
                      <label className="form-label">Research Interests</label>
                      <button onClick={addCustomInterest} className="add-custom-btn">
                        <Plus size={14} /> Add Custom
                      </button>
                    </div>
                    <div className="interests-grid">
                      {[...researchInterests, ...customInterests].map(interest => (
                        <button
                          key={interest}
                          onClick={() => toggleInterest(interest)}
                          className={`interest-chip ${programInfo.interests.includes(interest) ? 'active' : 'inactive'}`}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <div className="sections-header">
                    <h3 className="sections-title">Application Sections</h3>
                    <button onClick={() => setShowSectionModal(true)} className="add-section-btn">
                      <Plus size={18} /> Add Section
                    </button>
                  </div>
                  <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    First 3 sections are required. Add additional sections as needed.
                  </p>
                  <div className="sections-list">
                    {sections.map((section, index) => (
                      <div key={section.id} className="section-item">
                        <div className="section-header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
                              onChange={(e) => updateSectionFreeformContent(section.id, e.target.value)}
                              placeholder="Paste the complete application section content, including all questions, instructions, and any context..."
                              className="freeform-textarea"
                              rows={6}
                            />
                          </div>
                        )}
                        
                        {section.questions && section.questions.length > 0 && (
                          <ul className="question-list">
                            {section.questions.map((q, i) => (
                              <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0' }}>
                                <span>{q}</span>
                                <button 
                                  onClick={() => removeQuestion(section.id, i)}
                                  style={{ 
                                    background: 'none', 
                                    border: 'none', 
                                    color: '#dc2626', 
                                    cursor: 'pointer',
                                    fontSize: '1.25rem'
                                  }}
                                >
                                  ×
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="generate-section">
                  {hasSavedData && (
                    <div className="saved-data-notice">
                      <span>📁 Saved data found for {programInfo.collegeName}</span>
                      {savedDataInfo && (
                        <span className="saved-data-date">
                          (saved {new Date(savedDataInfo.savedAt).toLocaleDateString()})
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="generate-buttons">
                    {hasSavedData && (
                      <button onClick={loadSavedData} className="load-saved-btn">
                        <FolderOpen size={20} />
                        Load Saved Application
                      </button>
                    )}
                    
                    <button
                      onClick={processApplication}
                      disabled={loading || !programInfo.collegeName || !programInfo.program || (!files.cv && !fileTexts.cv) || (!files.sop && !fileTexts.sop)}
                      className="generate-btn"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="spin" size={20} />
                          {processingStep}
                        </>
                      ) : (
                        <>
                          Generate AI-Powered Application
                          <ChevronRight size={20} />
                        </>
                      )}
                    </button>
                  </div>
                  
                  {hasSavedData && (
                    <p className="generate-hint">
                      💡 "Load Saved" uses no API calls. "Generate" will reuse cached sections and only call API for new/changed content.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Section Modal */}
        {showSectionModal && (
          <div className="modal-overlay" onClick={() => setShowSectionModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Add Section</h3>
                <button onClick={() => setShowSectionModal(false)} className="modal-close">
                  <X size={24} />
                </button>
              </div>
              <div className="modal-body">
                <div className="section-templates">
                  {sectionTemplates
                    .filter(template => !sections.find(s => s.id === template.id))
                    .map(template => (
                      <button
                        key={template.id}
                        onClick={() => addSection(template)}
                        className="template-btn"
                      >
                        <div className="template-name">{template.name}</div>
                        {template.questions && template.questions.length > 0 && (
                          <div className="template-questions">{template.questions.length} questions</div>
                        )}
                      </button>
                    ))}
                  
                  {allUsedSectionNames
                    .filter(saved => 
                      !sectionTemplates.find(t => t.id === saved.id) && 
                      !sections.find(s => s.id === saved.id)
                    )
                    .map(saved => (
                      <button
                        key={saved.id}
                        onClick={() => addSection({ id: saved.id, name: saved.name, questions: [] })}
                        className="template-btn"
                        style={{ background: '#fef3c7', borderColor: '#fde047' }}
                      >
                        <div className="template-name">{saved.name}</div>
                        <div className="template-questions">Previously used</div>
                      </button>
                    ))}
                </div>
                <div className="custom-section-divider">
                  <span>or</span>
                </div>
                <button onClick={addCustomSection} className="custom-section-btn">
                  <Plus size={18} /> Create Custom Section
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // RESULTS PAGE (with corrected class names)
  return (
    <div className="results-container">
      <div className="top-bar">
        <div className="top-bar-content">
          <div className="program-info">
            <h2>{programInfo.collegeName}</h2>
            <p>{programInfo.program} • {selectedApplicant}</p>
          </div>
          <button onClick={() => setCurrentPage('setup')} className="change-settings-btn">
            Change Settings
          </button>
        </div>
      </div>

      <div className="main-layout">
        <div className="sidebar">
          <h3 className="sidebar-title">SECTIONS</h3>
          <div className="sidebar-nav">
            {sections.map((section, index) => (
              <button
                key={section.id}
                onClick={() => setCurrentSectionIndex(index)}
                className={`nav-btn ${currentSectionIndex === index ? 'active' : 'inactive'}`}
              >
                {section.name}
              </button>
            ))}
          </div>
        </div>

        <div className="content-area">
          {currentSection && (
            <div className="content-card">
              <div className="content-header">
                <h2 className="content-title">{currentSection.name}</h2>
                
                {currentSection.id === 'sop' && responses.sop && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => downloadDocument(responses.sop, `SoP_${programInfo.collegeName.replace(/\s+/g, '_')}.txt`)} className="download-btn">
                      📄 TXT
                    </button>
                    <button onClick={() => downloadAsDOCX(responses.sop, `SoP_${programInfo.collegeName.replace(/\s+/g, '_')}.docx`)} className="download-btn">
                      📝 DOCX
                    </button>
                    <button onClick={() => downloadAsPDF(responses.sop, `SoP_${programInfo.collegeName.replace(/\s+/g, '_')}.pdf`)} className="download-btn">
                      📑 PDF
                    </button>
                  </div>
                )}

                {currentSection.id === 'personal' && responses.personal && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => downloadDocument(responses.personal, `PersonalStatement_${programInfo.collegeName.replace(/\s+/g, '_')}.txt`)} className="download-btn">
                      📄 TXT
                    </button>
                    <button onClick={() => downloadAsDOCX(responses.personal, `PersonalStatement_${programInfo.collegeName.replace(/\s+/g, '_')}.docx`)} className="download-btn">
                      📝 DOCX
                    </button>
                    <button onClick={() => downloadAsPDF(responses.personal, `PersonalStatement_${programInfo.collegeName.replace(/\s+/g, '_')}.pdf`)} className="download-btn">
                      📑 PDF
                    </button>
                  </div>
                )}
              </div>

              <div className="content-body">
                {/* Faculty Section */}
                {currentSection.id === 'faculty' && responses.faculty && (
                  <>
                    <div 
                      className="response-text markdown-content"
                      dangerouslySetInnerHTML={{ __html: markdownToHTML(responses.faculty) }}
                    />
                    {renderEditPanel('faculty')}
                  </>
                )}

                {/* SoP Section */}
                {currentSection.id === 'sop' && responses.sop && (
                  <>
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
                    {renderEditPanel('sop')}
                  </>
                )}

                {/* Admission Analysis Section */}
                {currentSection.id === 'admission-analysis' && (
                  <>
                    {responses['admission-analysis'] ? (
                      <>
                        <div className="admission-analysis-notice">
                          <strong>📊 Honest Assessment:</strong> This analysis provides realistic feedback based on your materials. Use it to strengthen your application, not as a definitive prediction.
                        </div>
                        
                        <div 
                          className="response-text markdown-content admission-analysis-content"
                          dangerouslySetInnerHTML={{ __html: markdownToHTML(responses['admission-analysis']) }}
                        />
                        {renderEditPanel('admission-analysis')}
                      </>
                    ) : (
                      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                        <Loader2 className="spin" size={48} style={{ margin: '0 auto 1rem' }} />
                        <p>Generating admission analysis...</p>
                      </div>
                    )}
                  </>
                )}

                {/* Personal Statement Section */}
                {currentSection.id === 'personal' && responses.personal && (
                  <>
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
                    {renderEditPanel('personal')}
                  </>
                )}

                {/* Other Sections */}
                {!['faculty', 'sop', 'personal', 'admission-analysis'].includes(currentSection.id) && (
                  <>
                    <div className="questions-section">
                      {responses[currentSection.id]?.freeform ? (
                        <div 
                          className="response-text markdown-content"
                          dangerouslySetInnerHTML={{ __html: markdownToHTML(responses[currentSection.id].freeform) }}
                        />
                      ) : (
                        currentSection.questions && currentSection.questions.map((question, i) => (
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
                    {responses[currentSection.id] && renderEditPanel(currentSection.id)}
                  </>
                )}
              </div>

              <div className="navigation">
                <button
                  onClick={() => setCurrentSectionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentSectionIndex === 0}
                  className="nav-button prev"
                >
                  <ChevronLeft size={20} /> Previous
                </button>
                <button
                  onClick={() => setCurrentSectionIndex(prev => Math.min(sections.length - 1, prev + 1))}
                  disabled={currentSectionIndex === sections.length - 1}
                  className="nav-button next"
                >
                  Next <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GradApplicationAssistant;