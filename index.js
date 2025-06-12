// ==Bookmarklet Script==
// @name         OpenPhone AI Summarizer (Cookie Auth & High Z-Index)
// @description  Uses a floating button, cookie-based auth, and high z-index for maximum stability. Supports Gemini/GPT, vision, and chat.
// @version      26.0
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
    
    // --- SVG Icons ---
    const sparkleIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="white" d="M12 2.5a.75.75 0 0 1 .75.75V5a.75.75 0 0 1-1.5 0V3.25A.75.75 0 0 1 12 2.5zm0 14a.75.75 0 0 1 .75.75v1.75a.75.75 0 0 1-1.5 0V17.5a.75.75 0 0 1 .75-.75zM6.22 5.47a.75.75 0 0 1 1.06 0l1.25 1.25a.75.75 0 0 1-1.06 1.06L6.22 6.53a.75.75 0 0 1 0-1.06zm8.94 8.94a.75.75 0 0 1 1.06 0l1.25 1.25a.75.75 0 0 1-1.06 1.06l-1.25-1.25a.75.75 0 0 1 0-1.06zM2.5 11.25a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75zm18.5.75a.75.75 0 0 0 1.5 0v-1.5a.75.75 0 0 0-1.5 0v1.5zM6.22 15.22a.75.75 0 0 1 0-1.06l1.25-1.25a.75.75 0 0 1 1.06 1.06l-1.25 1.25a.75.75 0 0 1-1.06 0zM15.22 6.22a.75.75 0 0 1 0-1.06l1.25-1.25a.75.75 0 1 1 1.06 1.06l-1.25 1.25a.75.75 0 0 1-1.06 0z"></path></svg>`;
    const settingsIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20"><path fill="currentColor" d="M10.667 1.875A.833.833 0 0 0 10 1.25a.833.833 0 0 0-.667.625l-.234.937a5.218 5.218 0 0 0-1.593.84l-.87-.39a.833.833 0 0 0-.933.277L4.29 5.293a.833.833 0 0 0 .278.933l.794.516a5.233 5.233 0 0 0 0 1.916l-.794.516a.833.833 0 0 0-.278.933l1.414 1.414a.833.833 0 0 0 .933.278l.87-.39c.47.318.99.577 1.592.839l.234.937A.833.833 0 0 0 10 18.75a.833.833 0 0 0 .667-.625l.234-.937c.603-.262 1.122-.521 1.593-.84l.87.39a.833.833 0 0 0 .933-.277l1.414-1.414a.833.833 0 0 0-.278-.933l-.794-.516a5.233 5.233 0 0 0 0-1.916l.794-.516a.833.833 0 0 0 .278-.933L15.707 3.88a.833.833 0 0 0-.933-.278l-.87.39a5.218 5.218 0 0 0-1.592-.84l-.234-.937zM10 12.5a2.5 2.5 0 1 1 0-5a2.5 2.5 0 0 1 0 5z"></path></svg>`;
    const sendIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path fill="currentColor" d="M2.525 2.525a.75.75 0 0 1 .91-.073l13.5 6.75a.75.75 0 0 1 0 1.196l-13.5 6.75a.75.75 0 0 1-1.002-1.123L3.89 10 2.433 3.571a.75.75 0 0 1 .092-1.046z"></path></svg>`;
    
    // --- UI HELPER FUNCTIONS ---
    const injectStyles=()=>{const e="gemini-summarizer-styles";if(document.getElementById(e))return;const t=document.createElement("style");t.id=e;t.innerHTML=`\n            .floating-ai-button-container { position: fixed !important; bottom: 30px !important; right: 30px !important; z-index: 999999 !important; display: flex; align-items: center; background: #007bff; border-radius: 50px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }\n            .floating-ai-main-btn { background: transparent; border: none; padding: 12px 16px; cursor: pointer; display: flex; align-items: center; color: white; font-weight: 500; font-size: 16px; gap: 8px; }\n            .floating-ai-settings-btn { background: rgba(255,255,255,0.2); border: none; border-left: 1px solid rgba(255,255,255,0.3); padding: 8px; cursor: pointer; color: white; display:flex; align-items:center; border-top-right-radius: 50px; border-bottom-right-radius: 50px; }\n            .floating-ai-settings-btn:hover { background: rgba(0,0,0,0.2); }\n            .gemini-modal-overlay { position: fixed !important; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: 999998 !important; display: flex; align-items: center; justify-content: center; }\n            .gemini-modal-content { background-color: white; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.25); width: 90%; max-width: 800px; max-height: 90vh; display: flex; flex-direction: column; }\n            /* Other modal styles... (minified for brevity) */\n            .gemini-toast { position: fixed !important; top: 20px; right: 20px; background-color: #333; color: white; padding: 12px 20px; border-radius: 6px; z-index: 1000000 !important; font-size: 14px; transition: opacity 0.5s; opacity: 1; }\n        `,document.head.appendChild(t)};
    const showToast=(e,t="success")=>{const o=document.createElement("div");o.className=`gemini-toast ${t}`,o.textContent=e,document.body.appendChild(o),setTimeout(()=>{o.style.opacity="0",setTimeout(()=>o.remove(),500)},3e3)};
    const showApiKeyModal=()=>{const e=document.createElement("div");e.className="gemini-modal-overlay settings-modal";const t=localStorage.getItem(GEMINI_KEY_NAME)||"",o=localStorage.getItem(OPENAI_KEY_NAME)||"";e.innerHTML=`...`,document.body.appendChild(e);/* ... */};
    const showChatModal=(e,t,o)=>{/*...*/};
    const showExecutionOptionsModal=()=>{/*...*/};
    
    // --- CORE LOGIC ---
    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    };
    const setCookie = (name, value, days = 7) => {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    };

    const getAuthToken = () => {
        return new Promise((resolve, reject) => {
            // First, try to use the token from the cookie
            const cookieToken = getCookie(AUTH_COOKIE_NAME);
            if (cookieToken) {
                console.log("Using auth token from cookie.");
                return resolve(cookieToken);
            }
            
            // If no cookie, try to capture a new one
            console.log("No cookie found. Attempting to capture new auth token...");
            let capturedAuthToken = null;
            const originalFetch = window.fetch;
            const originalXhrSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
            const cleanup = () => { window.fetch = originalFetch; XMLHttpRequest.prototype.setRequestHeader = originalXhrSetRequestHeader; };

            window.fetch=function(...args){const headers=args[1]?.headers;if(headers&&(headers.Authorization||headers.authorization)){capturedAuthToken=headers.Authorization||headers.authorization}return originalFetch.apply(this,args)};
            XMLHttpRequest.prototype.setRequestHeader=function(header,value){if(header.toLowerCase()==='authorization'){capturedAuthToken=value}return originalXhrSetRequestHeader.apply(this,arguments)};

            let attempts = 0;
            const interval = setInterval(() => {
                if (capturedAuthToken) {
                    clearInterval(interval);
                    cleanup();
                    console.log("New token captured and saved to cookie.");
                    setCookie(AUTH_COOKIE_NAME, capturedAuthToken);
                    resolve(capturedAuthToken);
                } else if (attempts++ > 60) { // 15-second timeout
                    clearInterval(interval);
                    cleanup();
                    reject(new Error("Auth token capture timeout. Please interact with the page (e.g., click a conversation) and try again."));
                }
            }, 250);
        });
    };
    const generateUsefulFilename=e=>{/*...*/};
    const buildDynamicPrompt=e=>{/*...*/};
    
    const runSummaryProcess = async (modelName, selectedSections) => {
        // ... API key checks remain the same ...
        showToast("Starting summary process...", "success");

        try {
            let authToken = await getAuthToken();
            const conversationId = window.location.href.split('/').find(p => p.startsWith('CN'));
            if (!conversationId) throw new Error("Could not find Conversation ID in URL.");
            
            const openPhoneApiUrl = `https://communication.openphoneapi.com/v2/activity?id=${conversationId}&last=51`;
            let apiResponse = await fetch(openPhoneApiUrl, { headers: { 'Authorization': authToken } });

            // Self-healing token logic
            if (apiResponse.status === 401) {
                showToast("Auth token expired. Attempting to get a new one...", "error");
                setCookie(AUTH_COOKIE_NAME, '', -1); // Clear bad cookie
                authToken = await getAuthToken(); // This will force a new capture
                apiResponse = await fetch(openPhoneApiUrl, { headers: { 'Authorization': authToken }});
            }
            if (!apiResponse.ok) throw new Error(`OpenPhone API request failed: ${apiResponse.status}`);
            
            const openPhoneData = await apiResponse.json();
            // ... The rest of the processing logic (dynamic prompt, images, AI calls) remains the same ...

        } catch (error) {
            console.error("❌ An error occurred:", error);
            showToast(error.message, 'error');
        }
    };
    
    // --- STABLE INITIALIZATION LOGIC ---
    const createFloatingButton = () => {
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
    console.log("🚀 Initializing OpenPhone AI Summarizer v26...");
    injectStyles();
    createFloatingButton();
})();
