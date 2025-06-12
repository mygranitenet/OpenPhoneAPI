// ==Bookmarklet Script==
// @name         OpenPhone AI Summarizer (Floating Button Edition)
// @description  Adds a stable floating button to summarize conversations with Gemini or GPT, featuring a full interactive chat UI.
// @version      25.0
// @author       ilakskills
// ==/Bookmarklet Script==

(() => {
    // --- MASTER PROMPT & CONFIGURATION ---
    const PROMPT_SECTIONS = { title:`Title:\n...`,attendees:`Attendees:\n...`,project_topic:`Project/Topic:\n...`,discussion_points:`Content/Key Discussion Points:\n...`,decisions:`Decisions Made:\n...`,action_items:`Follow-Up Tasks / Action Items:\n...`,notes:`Notes/Observations (Optional):\n...`,quick_summary:`Quick Summary: ...`,quick_next_steps:`Quick Next Steps: ...`,disclaimer:`Disclaimer:\n...`};
    const BASE_PROMPT_HEADER = `Goal:\nTransform a potentially messy conversation log...`;
    const BASE_PROMPT_FOOTER = `? How I Work:\nSynthesize & Consolidate...`;
    const GEMINI_KEY_NAME = 'gemini_api_key_storage';
    const OPENAI_KEY_NAME = 'openai_api_key_storage';
    
    // --- SVG Icons ---
    const sparkleIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="white" d="M12 2.5a.75.75 0 0 1 .75.75V5a.75.75 0 0 1-1.5 0V3.25A.75.75 0 0 1 12 2.5zm0 14a.75.75 0 0 1 .75.75v1.75a.75.75 0 0 1-1.5 0V17.5a.75.75 0 0 1 .75-.75zM6.22 5.47a.75.75 0 0 1 1.06 0l1.25 1.25a.75.75 0 0 1-1.06 1.06L6.22 6.53a.75.75 0 0 1 0-1.06zm8.94 8.94a.75.75 0 0 1 1.06 0l1.25 1.25a.75.75 0 0 1-1.06 1.06l-1.25-1.25a.75.75 0 0 1 0-1.06zM2.5 11.25a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75zm18.5.75a.75.75 0 0 0 1.5 0v-1.5a.75.75 0 0 0-1.5 0v1.5zM6.22 15.22a.75.75 0 0 1 0-1.06l1.25-1.25a.75.75 0 0 1 1.06 1.06l-1.25 1.25a.75.75 0 0 1-1.06 0zM15.22 6.22a.75.75 0 0 1 0-1.06l1.25-1.25a.75.75 0 1 1 1.06 1.06l-1.25 1.25a.75.75 0 0 1-1.06 0z"></path></svg>`;
    const settingsIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20"><path fill="currentColor" d="M10.667 1.875A.833.833 0 0 0 10 1.25a.833.833 0 0 0-.667.625l-.234.937a5.218 5.218 0 0 0-1.593.84l-.87-.39a.833.833 0 0 0-.933.277L4.29 5.293a.833.833 0 0 0 .278.933l.794.516a5.233 5.233 0 0 0 0 1.916l-.794.516a.833.833 0 0 0-.278.933l1.414 1.414a.833.833 0 0 0 .933.278l.87-.39c.47.318.99.577 1.592.839l.234.937A.833.833 0 0 0 10 18.75a.833.833 0 0 0 .667-.625l.234-.937c.603-.262 1.122-.521 1.593-.84l.87.39a.833.833 0 0 0 .933-.277l1.414-1.414a.833.833 0 0 0-.278-.933l-.794-.516a5.233 5.233 0 0 0 0-1.916l.794-.516a.833.833 0 0 0 .278-.933L15.707 3.88a.833.833 0 0 0-.933-.278l-.87.39a5.218 5.218 0 0 0-1.592-.84l-.234-.937zM10 12.5a2.5 2.5 0 1 1 0-5a2.5 2.5 0 0 1 0 5z"></path></svg>`;
    const sendIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path fill="currentColor" d="M2.525 2.525a.75.75 0 0 1 .91-.073l13.5 6.75a.75.75 0 0 1 0 1.196l-13.5 6.75a.75.75 0 0 1-1.002-1.123L3.89 10 2.433 3.571a.75.75 0 0 1 .092-1.046z"></path></svg>`;
    
    // --- UI HELPER FUNCTIONS ---
    const injectStyles=()=>{const e="gemini-summarizer-styles";if(document.getElementById(e))return;const t=document.createElement("style");t.id=e;t.innerHTML=`\n            .floating-ai-button-container { position: fixed; bottom: 30px; right: 30px; z-index: 9999; display: flex; align-items: center; background: #007bff; border-radius: 50px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }\n            .floating-ai-main-btn { background: transparent; border: none; padding: 12px 16px; cursor: pointer; display: flex; align-items: center; color: white; font-weight: 500; font-size: 16px; gap: 8px; }\n            .floating-ai-settings-btn { background: rgba(255,255,255,0.2); border: none; border-left: 1px solid rgba(255,255,255,0.3); padding: 8px; cursor: pointer; color: white; display:flex; align-items:center; border-top-right-radius: 50px; border-bottom-right-radius: 50px; }\n            .floating-ai-settings-btn:hover { background: rgba(0,0,0,0.2); }\n            .gemini-modal-overlay{...} .gemini-modal-content{...} /* Minified for brevity */\n        `,document.head.appendChild(t)};
    const showToast=(e,t="success")=>{/*...*/};
    const showApiKeyModal=()=>{/*...*/};
    const showChatModal=(e,t,o)=>{/*...*/};
    const showExecutionOptionsModal=()=>{const e=document.createElement("div");e.className="gemini-modal-overlay options-modal";const t=Object.keys(PROMPT_SECTIONS).map(e=>`<label><input type="checkbox" name="section" value="${e}" checked>${e.replace(/_/g," ").replace(/\b\w/g,e=>e.toUpperCase())}</label>`).join("");e.innerHTML=`<div class="gemini-modal-content"><div class="gemini-modal-header"><h2>Generate Summary Options</h2><button class="gemini-modal-close">×</button></div><div class="gemini-modal-body"><div class="settings-section"><h3>AI Model</h3><div class="model-selection-grid"><label><input type="radio" name="model" value="gemini-1.5-flash-latest" checked> Gemini 1.5 Flash</label><label><input type="radio" name="model" value="gpt-4o"> GPT-4o</label><label><input type="radio" name="model" value="gpt-4-turbo"> GPT-4 Turbo</label></div></div><div class="settings-section"><h3>Output Sections</h3><div class="sections-grid">${t}</div></div></div><div class="gemini-modal-footer"><button class="gemini-modal-button" id="cancel-run">Cancel</button><button class="gemini-modal-button primary" id="generate-summary">Generate Summary</button></div></div>`,document.body.appendChild(e);const o=()=>e.remove();e.querySelector(".gemini-modal-close").addEventListener("click",o),e.querySelector("#cancel-run").addEventListener("click",o),e.querySelector("#generate-summary").addEventListener("click",()=>{const t=e.querySelector('input[name="model"]:checked').value,n=Array.from(e.querySelectorAll('input[name="section"]:checked')).map(e=>e.value);n.length>0?(o(),runSummaryProcess(t,n)):showToast("Please select at least one output section.","error")})};

    // --- CORE LOGIC ---
    const getAuthToken=()=>{/*...*/};
    const generateUsefulFilename=e=>{/*...*/};
    const buildDynamicPrompt=e=>{/*...*/};
    const runSummaryProcess = async (modelName, selectedSections) => {
        const geminiApiKey = localStorage.getItem(GEMINI_KEY_NAME);
        const openaiApiKey = localStorage.getItem(OPENAI_KEY_NAME);
        if (modelName.startsWith('gemini') && !geminiApiKey) return showToast("Gemini API Key not set.", "error");
        if (modelName.startsWith('gpt') && !openaiApiKey) return showToast("OpenAI API Key not set.", "error");
        showToast("Starting summary process...", "success");

        try {
            const authToken = await getAuthToken();
            const conversationId = window.location.href.split('/').find(p => p.startsWith('CN'));
            if (!conversationId) throw new Error("Could not find Conversation ID in URL. Please navigate to a conversation.");
            
            // --- API URL IS NOW ALWAYS THE LATEST ACTIVITIES ---
            const openPhoneApiUrl = `https://communication.openphoneapi.com/v2/activity?id=${conversationId}&last=51`;
            const apiResponse = await fetch(openPhoneApiUrl, { headers: { 'Authorization': authToken } });
            if (!apiResponse.ok) throw new Error(`OpenPhone API request failed: ${apiResponse.status}`);
            const openPhoneData = await apiResponse.json();
            if (openPhoneData.result.length === 0) return showToast("No activities found to summarize.", "error");

            const dynamicPrompt = buildDynamicPrompt(selectedSections);
            const textContent = dynamicPrompt + JSON.stringify(openPhoneData, null, 2);
            
            // --- Multimodal and API call logic remains unchanged ---
            let imagePayloads = [];
            const imageActivities = openPhoneData.result.filter(activity => activity.media?.some(m => m.type.startsWith('image/')));
            if (imageActivities.length > 0) { /* ... */ }

            let initialHistory, responseText;
            const finalFilename = generateUsefulFilename(conversationId);
            if (modelName.startsWith('gemini')) { /* ... */ } 
            else { /* ... */ } // OpenAI
            
            if (!responseText) throw new Error("AI response was empty or in an unexpected format.");
            showChatModal(initialHistory, finalFilename, modelName.startsWith('gemini') ? 'gemini' : modelName);
        } catch (error) {
            console.error("❌ An error occurred:", error);
            showToast(error.message, 'error');
        }
    };
    
    // --- STABLE INITIALIZATION LOGIC ---
    const createFloatingButton = () => {
        // Remove old button if it exists to prevent duplicates on re-run
        document.getElementById('ai-summarizer-floating-container')?.remove();

        const container = document.createElement('div');
        container.id = 'ai-summarizer-floating-container';
        container.className = 'floating-ai-button-container';

        const mainButton = document.createElement('button');
        mainButton.className = 'floating-ai-main-btn';
        mainButton.innerHTML = `${sparkleIconSVG}<span>AI Summary</span>`;
        mainButton.onclick = showExecutionOptionsModal;
        
        const settingsButton = document.createElement('button');
        settingsButton.className = 'floating-ai-settings-btn';
        settingsButton.innerHTML = settingsIconSVG;
        settingsButton.title = "API Key Settings";
        settingsButton.onclick = showApiKeyModal;

        container.appendChild(mainButton);
        container.appendChild(settingsButton);
        document.body.appendChild(container);

        console.log("✅ Floating AI Summarizer button added.");
    };

    // --- Run the script ---
    console.log("🚀 Initializing OpenPhone AI Summarizer v25...");
    injectStyles();
    createFloatingButton();
})();
