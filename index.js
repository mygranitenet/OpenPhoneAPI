// ==Bookmarklet Script==
// @name         OpenPhone AI Summarizer (Prompt Engineer Edition)
// @description  Floating button with on-demand model selection, custom instructions, and AI-powered date filtering.
// @version      34.0
// @author       ilakskills
// ==/Bookmarklet Script==

(() => {
    // --- MASTER PROMPT & CONFIGURATION ---
    const PROMPT_SECTIONS = { title:`Title:\n...`,attendees:`Attendees:\n...`,project_topic:`Project/Topic:\n...`,discussion_points:`Content/Key Discussion Points:\n...`,decisions:`Decisions Made:\n...`,action_items:`Follow-Up Tasks / Action Items:\n...`,notes:`Notes/Observations (Optional):\n...`,quick_summary:`Quick Summary: ...`,quick_next_steps:`Quick Next Steps: ...`,disclaimer:`Disclaimer:\n...`};
    const BASE_PROMPT_HEADER = `Goal:\nTransform a potentially messy conversation log...`;
    const BASE_PROMPT_FOOTER = `? How I Work:\nSynthesize & Consolidate...`;
    const GEMINI_KEY_NAME = 'gemini_api_key_storage';
    const OPENAI_KEY_NAME = 'openai_api_key_storage';
    const AUTH_COOKIE_NAME = 'openphone_auth_token';
    
    // --- SVG Icons & UI ---
    const sparkleIconSVG = `<svg ... ></svg>`; // Minified for brevity
    const settingsIconSVG = `<svg ... ></svg>`;
    const sendIconSVG = `<svg ... ></svg>`;
    const injectStyles=()=>{const e="gemini-summarizer-styles";if(document.getElementById(e))return;const t=document.createElement("style");t.id=e;t.innerHTML=`... .gemini-modal-button.active { border-color: #007bff; background-color: #cce5ff; }`,document.head.appendChild(t)};
    const showToast=(e,t="success")=>{/*...*/};
    const manageApiKeys=()=>{/*...*/};
    const showChatModal=(e,t,o)=>{/*...*/};

    // --- NEW: Options Modal with Custom Instructions and AI Date Filters ---
    const showExecutionOptionsModal = () => {
        const overlay = document.createElement('div');
        overlay.className = 'gemini-modal-overlay options-modal';
        const sectionsHtml = Object.keys(PROMPT_SECTIONS).map(key => `<label><input type="checkbox" name="section" value="${key}" checked>${key.replace(/_/g," ").replace(/\b\w/g,l=>l.toUpperCase())}</label>`).join('');

        overlay.innerHTML = `
            <div class="gemini-modal-content">
                <div class="gemini-modal-header"><h2>Generate Summary Options</h2><button class="gemini-modal-close">×</button></div>
                <div class="gemini-modal-body">
                    <div class="settings-section">
                        <h3>Custom Instructions (One-time)</h3>
                        <textarea id="custom-instructions" rows="3" style="width: 100%; font-family: sans-serif; padding: 8px;" placeholder="e.g., Act as a project manager. Focus on billing issues."></textarea>
                    </div>
                    <div class="settings-section">
                        <h3>AI-Powered Date Filter</h3>
                        <div class="date-filters">
                            <button class="gemini-modal-button" data-filter="today">Today</button>
                            <button class="gemini-modal-button" data-filter="yesterday">Yesterday</button>
                            <button class="gemini-modal-button" data-filter="week">This Week</button>
                            <button class="gemini-modal-button active" data-filter="all">All Available</button>
                        </div>
                    </div>
                    <div class="settings-section">
                        <h3>AI Model</h3>
                        <div class="model-selection-grid">
                            <label><input type="radio" name="model" value="gemini-1.5-flash-latest" checked> Gemini 1.5 Flash</label>
                            <label><input type="radio" name="model" value="gpt-4o"> GPT-4o</label>
                            <label><input type="radio" name="model" value="gpt-4-turbo"> GPT-4 Turbo</label>
                        </div>
                    </div>
                    <div class="settings-section">
                        <h3>Output Sections</h3>
                        <div class="sections-grid">${sectionsHtml}</div>
                    </div>
                </div>
                <div class="gemini-modal-footer">
                    <button class="gemini-modal-button" id="cancel-run">Cancel</button>
                    <button class="gemini-modal-button primary" id="generate-summary">Generate Summary</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);

        const closeModal = () => overlay.remove();
        overlay.querySelector('.gemini-modal-close').addEventListener('click', closeModal);
        overlay.querySelector('#cancel-run').addEventListener('click', closeModal);

        const filterButtons = overlay.querySelectorAll('.date-filters button');
        let activeFilter = 'all';
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeFilter = btn.dataset.filter;
            });
        });
        
        overlay.querySelector('#generate-summary').addEventListener('click', () => {
            const modelName = overlay.querySelector('input[name="model"]:checked').value;
            const selectedSections = Array.from(overlay.querySelectorAll('input[name="section"]:checked')).map(el => el.value);
            const customInstructions = overlay.querySelector('#custom-instructions').value;
            
            if (selectedSections.length > 0) {
                closeModal();
                runSummaryProcess(modelName, selectedSections, customInstructions, activeFilter);
            } else {
                showToast("Please select at least one output section.", "error");
            }
        });
    };

    // --- CORE LOGIC ---
    const getAuthToken=()=>{/*...*/};
    const generateUsefulFilename=(e)=>{/*...*/};
    
    // NEW: Function to build the entire dynamic prompt including new instructions
    const buildDynamicPrompt = (selectedSections, customInstructions, dateFilter) => {
        let finalPrompt = "";
        
        // 1. Add custom instructions first
        if (customInstructions && customInstructions.trim() !== "") {
            finalPrompt += `SPECIAL ONE-TIME INSTRUCTION:\n${customInstructions.trim()}\n\n---\n\n`;
        }

        // 2. Add AI-powered date filtering instruction
        let dateInstruction = "";
        switch(dateFilter) {
            case 'today':
                dateInstruction = "IMPORTANT DATE FILTER: In your analysis, you MUST only consider activities and conversations that occurred TODAY. Ignore all other dates.\n\n";
                break;
            case 'yesterday':
                dateInstruction = "IMPORTANT DATE FILTER: In your analysis, you MUST only consider activities and conversations that occurred YESTERDAY. Ignore all other dates.\n\n";
                break;
            case 'week':
                dateInstruction = "IMPORTANT DATE FILTER: In your analysis, you MUST only consider activities and conversations that occurred THIS CURRENT WEEK. Ignore all other dates.\n\n";
                break;
        }
        finalPrompt += dateInstruction;

        // 3. Build the structured prompt
        let structuredFormat = "";
        selectedSections.forEach(key => {
            if (PROMPT_SECTIONS[key]) structuredFormat += PROMPT_SECTIONS[key] + '\n';
        });

        // 4. Assemble everything
        finalPrompt += BASE_PROMPT_HEADER + structuredFormat + BASE_PROMPT_FOOTER;
        
        return finalPrompt;
    };
    
    const runSummaryProcess = async (modelName, selectedSections, customInstructions, dateFilter) => {
        const geminiApiKey = localStorage.getItem(GEMINI_KEY_NAME);
        const openaiApiKey = localStorage.getItem(OPENAI_KEY_NAME);
        if (modelName.startsWith('gemini') && !geminiApiKey) return showToast("Gemini API Key not set.", "error");
        if (modelName.startsWith('gpt') && !openaiApiKey) return showToast("OpenAI API Key not set.", "error");
        showToast("Starting summary process...", "success");

        try {
            let authToken = await getAuthToken();
            const conversationId = window.location.href.split('/').find(p => p.startsWith('CN'));
            if (!conversationId) throw new Error("Could not find Conversation ID in URL.");
            
            const openPhoneApiUrl = `https://communication.openphoneapi.com/v2/activity?id=${conversationId}&last=51`;
            let apiResponse = await fetch(openPhoneApiUrl, { headers: { 'Authorization': authToken } });

            if (apiResponse.status === 401) {
                // Self-healing token logic
            }
            if (!apiResponse.ok) throw new Error(`OpenPhone API request failed: ${apiResponse.status}`);
            
            const openPhoneData = await apiResponse.json();
            if (openPhoneData.result.length === 0) return showToast("No activities found to summarize.", "error");
            
            // Build the complete, dynamic prompt with all new instructions
            const dynamicPrompt = buildDynamicPrompt(selectedSections, customInstructions, dateFilter);
            const textContent = dynamicPrompt + "\n\n--- JSON DATA TO ANALYZE ---\n" + JSON.stringify(openPhoneData, null, 2);
            
            // ... (The rest of the logic for image processing and API calls is the same, but it now uses the new `textContent`) ...
            let imagePayloads = []; // ...
            let initialHistory, responseText; // ...
            const finalFilename = generateUsefulFilename(conversationId);

            if (modelName.startsWith('gemini')) { /* ... Gemini call with `textContent` ... */ }
            else { /* ... OpenAI call with `textContent` ... */ }
            
            if (!responseText) throw new Error("AI response was empty or in an unexpected format.");
            showChatModal(initialHistory, finalFilename, modelName);
            
        } catch (error) {
            console.error("❌ An error occurred:", error);
            showToast(error.message, 'error');
        }
    };
    
    // --- STABLE INITIALIZATION LOGIC ---
    const createFloatingButton = () => { /* ... (Unchanged) ... */};
    console.log("🚀 Initializing OpenPhone AI Summarizer v34...");
    injectStyles();
    createFloatingButton();
})();
