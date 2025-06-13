// ==Bookmarklet Script==
// @name         OpenPhone AI Summarizer (Final Stable Build)
// @description  Uses a floating button and stable browser prompts. Summarizes with Gemini/GPT and enables conversational refinement.
// @version      35.0
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
    const injectStyles = () => {
        const styleId = 'gemini-summarizer-styles';
        if (document.getElementById(styleId)) return;
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            .floating-ai-button-container { position: fixed !important; bottom: 30px !important; right: 30px !important; z-index: 999999 !important; display: flex; align-items: center; background: #007bff; border-radius: 50px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
            .floating-ai-main-btn { background: transparent; border: none; padding: 12px 16px; cursor: pointer; display: flex; align-items: center; color: white; font-weight: 500; font-size: 16px; gap: 8px; }
            .floating-ai-settings-btn { background: rgba(255,255,255,0.2); border: none; border-left: 1px solid rgba(255,255,255,0.3); padding: 8px; cursor: pointer; color: white; display:flex; align-items:center; border-top-right-radius: 50px; border-bottom-right-radius: 50px; }
            .floating-ai-settings-btn:hover { background: rgba(0,0,0,0.2); }
            .gemini-modal-overlay { position: fixed !important; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: 999998 !important; display: flex; align-items: center; justify-content: center; }
            .gemini-modal-content { background-color: white; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.25); width: 90%; max-width: 800px; max-height: 90vh; display: flex; flex-direction: column; }
            .gemini-modal-header { padding: 16px; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center; } .gemini-modal-header h2 { margin: 0; font-size: 18px; color: #333; }
            .gemini-modal-close { font-size: 24px; font-weight: bold; cursor: pointer; color: #888; border: none; background: none; }
            .gemini-modal-body { padding: 16px; overflow-y: auto; font-family: sans-serif; flex-grow: 1; line-height: 1.5; white-space: normal; background-color: #fff; }
            .gemini-modal-footer { padding: 12px 16px; border-top: 1px solid #e0e0e0; display: flex; gap: 10px; justify-content: flex-end; }
            .gemini-modal-button { padding: 8px 16px; border-radius: 6px; border: 1px solid #ccc; background-color: #f0f0f0; cursor: pointer; font-weight: 500; } .gemini-modal-button:hover { background-color: #e0e0e0; } .gemini-modal-button.primary { background-color: #007bff; color: white; border-color: #007bff; } .gemini-modal-button.primary:hover { background-color: #0056b3; } .gemini-modal-button.active { border-color: #007bff; background-color: #cce5ff; }
            .gemini-toast { position: fixed !important; top: 20px; right: 20px; background-color: #333; color: white; padding: 12px 20px; border-radius: 6px; z-index: 1000000 !important; font-size: 14px; transition: opacity 0.5s; opacity: 1; }
            .settings-section { margin-bottom: 20px; } .settings-section h3 { margin:0 0 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; } .settings-section label { display: block; margin-bottom: 5px; font-weight: bold; }
            .settings-section input[type="text"], .settings-section textarea { width: 100%; padding: 8px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; font-family: sans-serif; } .date-filters button { margin-right: 5px; }
            .sections-grid, .model-selection-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; } .model-selection-grid label { font-weight: normal; } .sections-grid label { font-weight: normal; }
            .chat-log { display: flex; flex-direction: column; gap: 12px; } .message-bubble { padding: 10px 14px; border-radius: 18px; max-width: 80%; line-height: 1.5; white-space: pre-wrap; word-break: break-word; } .message-bubble.user { background-color: #007bff; color: white; align-self: flex-end; } .message-bubble.model { background-color: #e9e9eb; color: #1c1c1e; align-self: flex-start; } .message-bubble.loading { align-self: flex-start; } .message-bubble.error { background-color: #ffcccc; color: #a00; }
            .chat-input-form { display: flex; gap: 10px; padding: 10px 16px; border-top: 1px solid #e0e0e0; } #chat-input { flex-grow: 1; padding: 10px; border: 1px solid #ccc; border-radius: 20px; } #chat-send-btn { background: #007bff; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }`;
        document.head.appendChild(t);
    };
    const showToast = (message, type = 'success') => { const toast = document.createElement('div'); toast.className = `gemini-toast ${type}`; toast.textContent = message; document.body.appendChild(toast); setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 500); }, 3000); };
    const manageApiKeys=()=>{const geminiKey=localStorage.getItem(GEMINI_KEY_NAME)||"";const newGeminiKey=prompt("Enter your Gemini API Key:",geminiKey);if(newGeminiKey!==null){newGeminiKey.trim()?localStorage.setItem(GEMINI_KEY_NAME,newGeminiKey.trim()):localStorage.removeItem(GEMINI_KEY_NAME)}const openaiKey=localStorage.getItem(OPENAI_KEY_NAME)||"";const newOpenAIKey=prompt("Enter your OpenAI API Key:",openaiKey);if(newOpenAIKey!==null){newOpenAIKey.trim()?localStorage.setItem(OPENAI_KEY_NAME,newOpenAIKey.trim()):localStorage.removeItem(OPENAI_KEY_NAME)}showToast("API Keys updated!","success")};
    const showExecutionOptionsModal = () => {
        const overlay = document.createElement("div");
        overlay.className = "gemini-modal-overlay options-modal";
        const sectionsHtml = Object.keys(PROMPT_SECTIONS).map(key => `<label><input type="checkbox" name="section" value="${key}" checked>${key.replace(/_/g," ").replace(/\b\w/g,l=>l.toUpperCase())}</label>`).join("");
        overlay.innerHTML = `<div class="gemini-modal-content"><div class="gemini-modal-header"><h2>Generate Summary Options</h2><button class="gemini-modal-close">×</button></div><div class="gemini-modal-body"><div class="settings-section"><h3>Custom Instructions (One-time)</h3><textarea id="custom-instructions" rows="3" style="width:100%" placeholder="e.g., Act as a project manager. Focus on billing issues."></textarea></div><div class="settings-section"><h3>AI-Powered Date Filter</h3><div class="date-filters"><button class="gemini-modal-button" data-filter="today">Today</button><button class="gemini-modal-button" data-filter="yesterday">Yesterday</button><button class="gemini-modal-button" data-filter="week">This Week</button><button class="gemini-modal-button active" data-filter="all">All Available</button></div></div><div class="settings-section"><h3>AI Model</h3><div class="model-selection-grid"><label><input type="radio" name="model" value="gemini-1.5-flash-latest" checked> Gemini 1.5 Flash</label><label><input type="radio" name="model" value="gpt-4o"> GPT-4o</label><label><input type="radio" name="model" value="gpt-4-turbo"> GPT-4 Turbo</label></div></div><div class="settings-section"><h3>Output Sections</h3><div class="sections-grid">${sectionsHtml}</div></div></div><div class="gemini-modal-footer"><button class="gemini-modal-button" id="cancel-run">Cancel</button><button class="gemini-modal-button primary" id="generate-summary">Generate Summary</button></div></div>`;
        document.body.appendChild(overlay);
        const closeModal = () => overlay.remove();
        overlay.querySelector(".gemini-modal-close").addEventListener("click", closeModal);
        overlay.querySelector("#cancel-run").addEventListener("click", closeModal);
        const filterButtons = overlay.querySelectorAll(".date-filters button");
        let activeFilter = "all";
        filterButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                filterButtons.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                activeFilter = btn.dataset.filter;
            });
        });
        overlay.querySelector("#generate-summary").addEventListener("click", () => {
            const modelName = overlay.querySelector('input[name="model"]:checked').value;
            const selectedSections = Array.from(overlay.querySelectorAll('input[name="section"]:checked')).map(el => el.value);
            const customInstructions = overlay.querySelector("#custom-instructions").value;
            if (selectedSections.length > 0) {
                closeModal();
                runSummaryProcess(modelName, selectedSections, customInstructions, activeFilter);
            } else {
                showToast("Please select at least one output section.", "error");
            }
        });
    };
    const showChatModal = (initialHistory, filename, modelType) => {
        let chatHistory = [...initialHistory];
        const overlay = document.createElement("div");
        overlay.className = "gemini-modal-overlay chat-modal";
        overlay.innerHTML = `<div class="gemini-modal-content"><div class="gemini-modal-header"><h2>AI Summary & Refinement</h2><button class="gemini-modal-close">×</button></div><div class="gemini-modal-body" style="background-color:white;"><div class="chat-log"></div></div><form class="chat-input-form"><input type="text" id="chat-input" placeholder="Refine the summary..." autocomplete="off"><button type="submit" id="chat-send-btn" title="Send">${sendIconSVG}</button></form><div class="gemini-modal-footer"><button class="gemini-modal-button download-btn">Download Last</button><button class="gemini-modal-button primary copy-btn">Copy Last</button></div></div>`;
        document.body.appendChild(overlay);
        const chatLog = overlay.querySelector(".chat-log"),
            chatInput = overlay.querySelector("#chat-input"),
            chatForm = overlay.querySelector(".chat-input-form"),
            closeModal = () => overlay.remove();
        const appendMessage = (sender, text) => {
            const bubble = document.createElement("div");
            return bubble.className = `message-bubble ${sender}`, bubble.textContent = text, chatLog.appendChild(bubble), chatLog.scrollTop = chatLog.scrollHeight, bubble
        };
        const initialAiResponse = chatHistory.find(h => "model" === h.role)?.parts[0]?.text;
        initialAiResponse && appendMessage("model", initialAiResponse);
        const sendChatMessage = async message => {
            appendMessage("user", message), chatInput.value = "";
            const loadingBubble = appendMessage("model loading", "...");
            chatHistory.push({ role: "user", parts: [{ text: message }] });
            try {
                let apiUrl, apiKey, payload, headers;
                if (modelType.startsWith("gemini")) {
                    apiKey = localStorage.getItem(GEMINI_KEY_NAME);
                    apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
                    payload = { contents: chatHistory };
                    headers = { "Content-Type": "application/json" };
                } else {
                    apiKey = localStorage.getItem(OPENAI_KEY_NAME);
                    apiUrl = "https://api.openai.com/v1/chat/completions";
                    const openAiMessages = chatHistory.map(({ role, parts }) => ({ role: "model" === role ? "assistant" : role, content: parts[0].text }));
                    payload = { model: modelType, messages: openAiMessages, max_tokens: 4096 };
                    headers = { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` };
                }
                const response = await fetch(apiUrl, { method: "POST", headers: headers, body: JSON.stringify(payload) });
                if (!response.ok) throw new Error(`API Error: ${await response.text()}`);
                const data = await response.json();
                const newText = modelType.startsWith("gemini") ? data.candidates?.[0]?.content?.parts?.[0]?.text : data.choices?.[0]?.message?.content;
                if (!newText) throw new Error("Received an empty response from AI.");
                chatHistory.push({ role: "model", parts: [{ text: newText }] }), loadingBubble.remove(), appendMessage("model", newText)
            } catch (error) { loadingBubble.remove(), appendMessage("error", `Error: ${error.message}`), console.error(error) }
        };
        chatForm.addEventListener("submit", e => { e.preventDefault(); const message = chatInput.value.trim(); message && sendChatMessage(message) });
        overlay.querySelector(".gemini-modal-close").addEventListener("click", closeModal);
        overlay.querySelector(".copy-btn").addEventListener("click", () => { const last = chatLog.querySelector(".message-bubble.model:last-child"); last && navigator.clipboard.writeText(last.textContent).then(() => showToast("Copied!")) });
        overlay.querySelector(".download-btn").addEventListener("click", () => { const last = chatLog.querySelector(".message-bubble.model:last-child"); if (last) { const blob = new Blob([last.textContent], { type: "text/plain;charset=utf-8" }), link = document.createElement("a"); link.href = URL.createObjectURL(blob), link.download = filename, link.click(), URL.revokeObjectURL(link.href) } })
    };

    // --- CORE LOGIC ---
    const getCookie = e => { const t = `; ${document.cookie}`, o = t.split(`; ${e}=`); if (2 === o.length) return o.pop().split(";").shift() };
    const setCookie = (e, t, o = 7) => { let n = ""; if (o) { const s = new Date; s.setTime(s.getTime() + 24 * o * 60 * 60 * 1e3), n = "; expires=" + s.toUTCString() } document.cookie = `${e}=${t||""}${n}; path=/` };
    const getAuthToken = () => { return new Promise((resolve, reject) => { const cookieToken = getCookie(AUTH_COOKIE_NAME); if (cookieToken) return resolve(cookieToken); let capturedAuthToken = null; const originalFetch = window.fetch, originalXhrSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader, cleanup = () => { window.fetch = originalFetch, XMLHttpRequest.prototype.setRequestHeader = originalXhrSetRequestHeader }; window.fetch = function(...args) { const headers = args[1]?.headers; if (headers && (headers.Authorization || headers.authorization)) capturedAuthToken = headers.Authorization || headers.authorization; return originalFetch.apply(this, args) }; XMLHttpRequest.prototype.setRequestHeader = function(header, value) { if (header.toLowerCase() === 'authorization') capturedAuthToken = value; return originalXhrSetRequestHeader.apply(this, arguments) }; let attempts = 0; const interval = setInterval(() => { if (capturedAuthToken) { clearInterval(interval); cleanup(); setCookie(AUTH_COOKIE_NAME, capturedAuthToken); resolve(capturedAuthToken) } else if (attempts++ > 60) { clearInterval(interval); cleanup(); reject(new Error("Auth token capture timeout.")) } }, 250) }) };
    const generateUsefulFilename = e => { const t = new Date, o = e => e.toString().padStart(2, "0"), n = `${t.getFullYear()}-${o(t.getMonth()+1)}-${o(t.getDate())}_${o(t.getHours())}-${o(t.getMinutes())}`; let s = document.querySelector('[data-test-id="conversation-header-title"]'); return s = s && s.textContent.trim() ? s.textContent.trim().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") : e, `${n}_${s}_OpenPhone_Summary.txt` };
    const buildDynamicPrompt=(selectedSections,customInstructions,dateFilter)=>{let finalPrompt="";customInstructions&&""!==customInstructions.trim()&&(finalPrompt+=`SPECIAL ONE-TIME INSTRUCTION:\n${customInstructions.trim()}\n\n---\n\n`);let dateInstruction="";switch(dateFilter){case"today":dateInstruction="IMPORTANT DATE FILTER: In your analysis, you MUST only consider activities and conversations that occurred TODAY. Ignore all other dates.\n\n";break;case"yesterday":dateInstruction="IMPORTANT DATE FILTER: In your analysis, you MUST only consider activities and conversations that occurred YESTERDAY. Ignore all other dates.\n\n";break;case"week":dateInstruction="IMPORTANT DATE FILTER: In your analysis, you MUST only consider activities and conversations that occurred THIS CURRENT WEEK. Ignore all other dates.\n\n"}finalPrompt+=dateInstruction;let structuredFormat="";return selectedSections.forEach(e=>{PROMPT_SECTIONS[e]&&(structuredFormat+=PROMPT_SECTIONS[e]+"\n")}),finalPrompt+=BASE_PROMPT_HEADER+structuredFormat+BASE_PROMPT_FOOTER,finalPrompt};
    const runSummaryProcess = async (modelName, selectedSections, customInstructions, dateFilter) => {
        const geminiApiKey = localStorage.getItem(GEMINI_KEY_NAME),
            openaiApiKey = localStorage.getItem(OPENAI_KEY_NAME);
        if (modelName.startsWith("gemini") && !geminiApiKey) return showToast("Gemini API Key not set.", "error");
        if (modelName.startsWith("gpt") && !openaiApiKey) return showToast("OpenAI API Key not set.", "error");
        showToast("Starting summary process...", "success");
        try {
            let authToken = await getAuthToken();
            const conversationId = window.location.href.split("/").find(e => e.startsWith("CN"));
            if (!conversationId) throw new Error("Could not find Conversation ID in URL.");
            const openPhoneApiUrl = `https://communication.openphoneapi.com/v2/activity?id=${conversationId}&last=51`;
            let apiResponse = await fetch(openPhoneApiUrl, { headers: { Authorization: authToken } });
            if (401 === apiResponse.status && (showToast("Auth token expired. Capturing a new one...", "error"), setCookie(AUTH_COOKIE_NAME, "", -1), authToken = await getAuthToken(), apiResponse = await fetch(openPhoneApiUrl, { headers: { Authorization: authToken } })), !apiResponse.ok) throw new Error(`OpenPhone API request failed: ${apiResponse.status}`);
            const openPhoneData = await apiResponse.json();
            if (0 === openPhoneData.result.length) return showToast("No activities found to summarize.", "error");
            const dynamicPrompt = buildDynamicPrompt(selectedSections, customInstructions, dateFilter),
                textContent = `${dynamicPrompt}\n\n--- JSON DATA TO ANALYZE ---\n${JSON.stringify(openPhoneData,null,2)}`;
            let imagePayloads = [],
                imageActivities = openPhoneData.result.filter(e => e.media?.some(e => e.type.startsWith("image/")));
            if (imageActivities.length > 0) {
                showToast(`Found ${imageActivities.length} image(s). Fetching...`);
                const urlToDataUrl = async e => { try { const t = await fetch(e.url); if (!t.ok) throw new Error("Failed to fetch image"); const o = await t.blob(); return new Promise(e => { const t = new FileReader; t.onloadend = () => e({ mime: o.type, dataUrl: t.result }), t.readAsDataURL(o) }) } catch (t) { return console.error(`Skipping image ${e.url}:`, t), null } };
                imagePayloads = (await Promise.all(imageActivities.flatMap(e => e.media.map(urlToDataUrl)))).filter(e => e)
            }
            let initialHistory, responseText;
            const finalFilename = generateUsefulFilename(conversationId);
            if (modelName.startsWith("gemini")) {
                const textPart = { text: textContent },
                    imageParts = imagePayloads.map(e => ({ inlineData: { mimeType: e.mime, data: e.dataUrl.split(",")[1] } })),
                    initialUserPayload = { role: "user", parts: [textPart, ...imageParts] },
                    geminiPayload = { contents: [initialUserPayload] };
                showToast("Sending data to Gemini...");
                const geminiFetchResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(geminiPayload) });
                if (!geminiFetchResponse.ok) throw new Error(`Gemini API Error: ${await geminiFetchResponse.text()}`);
                const geminiResponse = await geminiFetchResponse.json();
                responseText = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text, initialHistory = [initialUserPayload, { role: "model", parts: [{ text: responseText }] }]
            } else {
                const systemMessage = { role: "system", content: BASE_PROMPT_HEADER + BASE_PROMPT_FOOTER },
                    userContent = [{ type: "text", text: `${dynamicPrompt}\n\n--- JSON DATA TO ANALYZE ---\n${JSON.stringify(openPhoneData,null,2)}` }];
                imagePayloads.forEach(e => userContent.push({ type: "image_url", image_url: { url: e.dataUrl } }));
                const userMessage = { role: "user", content: userContent },
                    openaiPayload = { model: modelName, messages: [systemMessage, userMessage], max_tokens: 4096 };
                showToast(`Sending data to ${modelName.toUpperCase()}...`);
                const openaiFetchResponse = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiApiKey}` }, body: JSON.stringify(openaiPayload) });
                if (!openaiFetchResponse.ok) throw new Error(`OpenAI API Error: ${await openaiFetchResponse.text()}`);
                const openaiResponse = await openaiFetchResponse.json();
                responseText = openaiResponse.choices?.[0]?.message?.content, initialHistory = [systemMessage, userMessage, { role: "model", parts: [{ text: responseText }] }]
            }
            if (!responseText) throw new Error("AI response was empty or in an unexpected format.");
            showChatModal(initialHistory, finalFilename, modelName)
        } catch (error) { console.error("❌ An error occurred:", error), showToast(error.message, "error") }
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
        mainButton.addEventListener('click', showExecutionOptionsModal);
        const settingsButton = document.createElement('button');
        settingsButton.className = 'floating-ai-settings-btn';
        settingsButton.innerHTML = settingsIconSVG;
        settingsButton.title = "API Key Settings";
        settingsButton.addEventListener('click', manageApiKeys); 
        container.appendChild(mainButton);
        container.appendChild(settingsButton);
        document.body.appendChild(container);
        console.log("✅ Floating AI Summarizer button added.");
    };

    console.log("🚀 Initializing OpenPhone AI Summarizer v35...");
    injectStyles();
    createFloatingButton();
})();
