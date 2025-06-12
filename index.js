// ==Bookmarklet Script==
// @name         OpenPhone AI Summarizer (Final Stable Build)
// @description  Uses a floating button and stable browser prompts. Summarizes with Gemini/GPT and enables conversational refinement.
// @version      30.0
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
    const injectStyles=()=>{const e="gemini-summarizer-styles";if(document.getElementById(e))return;const t=document.createElement("style");t.id=e;t.innerHTML=`...`,document.head.appendChild(t)};
    const showToast=(e,t="success")=>{const o=document.createElement("div");o.className=`gemini-toast ${t}`,o.textContent=e,document.body.appendChild(o),setTimeout(()=>{o.style.opacity="0",setTimeout(()=>o.remove(),500)},3e3)};
    const manageApiKeys=()=>{const e=localStorage.getItem(GEMINI_KEY_NAME)||"";const t=prompt("Enter your Gemini API Key:",e);null!==t&&(t.trim()?localStorage.setItem(GEMINI_KEY_NAME,t.trim()):localStorage.removeItem(GEMINI_KEY_NAME));const o=localStorage.getItem(OPENAI_KEY_NAME)||"";const n=prompt("Enter your OpenAI API Key:",o);null!==n&&(n.trim()?localStorage.setItem(OPENAI_KEY_NAME,n.trim()):localStorage.removeItem(OPENAI_KEY_NAME));showToast("API Keys updated!","success")};

    // *** THIS IS THE FULLY RESTORED, WORKING CHAT MODAL FUNCTION ***
    const showChatModal = (initialHistory, filename, modelType) => {
        let chatHistory = [...initialHistory];
        const overlay = document.createElement('div');
        overlay.className = 'gemini-modal-overlay chat-modal';
        overlay.innerHTML = `
            <div class="gemini-modal-content">
                <div class="gemini-modal-header"><h2>AI Summary & Refinement</h2><button class="gemini-modal-close">×</button></div>
                <div class="gemini-modal-body"><div class="chat-log"></div></div>
                <form class="chat-input-form">
                    <input type="text" id="chat-input" placeholder="Refine the summary..." autocomplete="off">
                    <button type="submit" id="chat-send-btn" title="Send">${sendIconSVG}</button>
                </form>
                <div class="gemini-modal-footer">
                    <button class="gemini-modal-button download-btn">Download Last</button>
                    <button class="gemini-modal-button primary copy-btn">Copy Last</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);

        const chatLog = overlay.querySelector('.chat-log');
        const chatInput = overlay.querySelector('#chat-input');
        const chatForm = overlay.querySelector('.chat-input-form');
        const closeModal = () => overlay.remove();

        const appendMessage = (sender, text) => {
            const bubble = document.createElement('div');
            bubble.className = `message-bubble ${sender}`;
            bubble.textContent = text;
            chatLog.appendChild(bubble);
            chatLog.scrollTop = chatLog.scrollHeight;
            return bubble;
        };
        
        const initialAiResponse = chatHistory.find(h => h.role === 'model')?.parts[0]?.text;
        if (initialAiResponse) appendMessage('model', initialAiResponse);

        const sendChatMessage = async (message) => {
            appendMessage('user', message);
            chatInput.value = '';
            const loadingBubble = appendMessage('model loading', '...');
            
            chatHistory.push({ role: 'user', parts: [{ text: message }] });
            
            try {
                let apiUrl, apiKey, payload, headers;

                if (modelType.startsWith('gemini')) {
                    apiKey = localStorage.getItem(GEMINI_KEY_NAME);
                    apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
                    payload = { contents: chatHistory };
                    headers = { 'Content-Type': 'application/json' };
                } else { // OpenAI
                    apiKey = localStorage.getItem(OPENAI_KEY_NAME);
                    apiUrl = 'https://api.openai.com/v1/chat/completions';
                    // Convert history to OpenAI format
                    const openAiMessages = chatHistory.map(({ role, parts }) => ({
                        role: role === 'model' ? 'assistant' : role, // Gemini uses 'model', OpenAI uses 'assistant'
                        content: parts[0].text // Assuming simple text parts for chat
                    }));
                    payload = { model: modelType, messages: openAiMessages, max_tokens: 4096 };
                    headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` };
                }

                const response = await fetch(apiUrl, { method: 'POST', headers: headers, body: JSON.stringify(payload) });
                if (!response.ok) throw new Error(`API Error: ${await response.text()}`);
                const data = await response.json();
                
                const newText = modelType.startsWith('gemini')
                    ? data.candidates?.[0]?.content?.parts?.[0]?.text
                    : data.choices?.[0]?.message?.content;

                if (!newText) throw new Error("Received an empty response from AI.");
                
                chatHistory.push({ role: 'model', parts: [{ text: newText }] });
                loadingBubble.remove();
                appendMessage('model', newText);

            } catch(error) {
                loadingBubble.remove();
                appendMessage('error', `Error: ${error.message}`);
                console.error(error);
            }
        };

        chatForm.addEventListener('submit', (e) => { e.preventDefault(); const message = chatInput.value.trim(); if (message) sendChatMessage(message); });
        overlay.querySelector('.gemini-modal-close').addEventListener('click', closeModal);
        overlay.querySelector('.copy-btn').addEventListener('click', () => {
            const lastModelResponse = chatLog.querySelector('.message-bubble.model:last-child');
            if (lastModelResponse) navigator.clipboard.writeText(lastModelResponse.textContent).then(() => showToast('Copied to clipboard!'));
        });
        overlay.querySelector('.download-btn').addEventListener('click', () => {
             const lastModelResponse = chatLog.querySelector('.message-bubble.model:last-child');
             if (lastModelResponse) {
                const blob = new Blob([lastModelResponse.textContent], { type: 'text/plain;charset=utf-8' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = filename;
                link.click();
                URL.revokeObjectURL(link.href);
             }
        });
    };
    const showExecutionOptionsModal=()=>{/*...*/};
    
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
            let authToken = await getAuthToken();
            const conversationId = window.location.href.split('/').find(p => p.startsWith('CN'));
            if (!conversationId) throw new Error("Could not find Conversation ID in URL. Please navigate to a conversation.");
            
            const openPhoneApiUrl = `https://communication.openphoneapi.com/v2/activity?id=${conversationId}&last=51`;
            let apiResponse = await fetch(openPhoneApiUrl, { headers: { 'Authorization': authToken } });

            if (apiResponse.status === 401) {
                showToast("Auth token expired. Capturing a new one...", "error");
                setCookie(AUTH_COOKIE_NAME, '', -1);
                authToken = await getAuthToken();
                apiResponse = await fetch(openPhoneApiUrl, { headers: { 'Authorization': authToken }});
            }
            if (!apiResponse.ok) throw new Error(`OpenPhone API request failed: ${apiResponse.status}`);
            
            const openPhoneData = await apiResponse.json();
            if (openPhoneData.result.length === 0) return showToast("No activities found to summarize.", "error");
            
            const dynamicPrompt = buildDynamicPrompt(selectedSections);
            const textContent = dynamicPrompt + JSON.stringify(openPhoneData, null, 2);
            
            let imagePayloads = [];
            const imageActivities = openPhoneData.result.filter(activity => activity.media?.some(m => m.type.startsWith('image/')));
            if (imageActivities.length > 0) {
                showToast(`Found ${imageActivities.length} image(s). Fetching...`);
                const urlToDataUrl = async (mediaItem) => {
                    try {
                        const response = await fetch(mediaItem.url);
                        if (!response.ok) throw new Error(`Failed to fetch image`);
                        const blob = await response.blob();
                        return new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve({ mime: blob.type, dataUrl: reader.result });
                            reader.readAsDataURL(blob);
                        });
                    } catch (error) { console.error(`Skipping image ${mediaItem.url}:`, error); return null; }
                };
                const dataUrlPromises = imageActivities.flatMap(activity => activity.media.map(urlToDataUrl));
                imagePayloads = (await Promise.all(dataUrlPromises)).filter(p => p !== null);
            }

            let initialHistory, responseText;
            const finalFilename = generateUsefulFilename(conversationId);
            if (modelName.startsWith('gemini')) {
                const textPart = { text: textContent };
                const imageParts = imagePayloads.map(p => ({ inlineData: { mimeType: p.mime, data: p.dataUrl.split(',')[1] } }));
                const initialUserPayload = { role: 'user', parts: [textPart, ...imageParts] };
                const geminiPayload = { contents: [initialUserPayload] };
                showToast("Sending data to Gemini...");
                const geminiFetchResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(geminiPayload) });
                if (!geminiFetchResponse.ok) throw new Error(`Gemini API Error: ${await geminiFetchResponse.text()}`);
                const geminiResponse = await geminiFetchResponse.json();
                responseText = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text;
                initialHistory = [initialUserPayload, { role: 'model', parts: [{ text: responseText }] }];
            } else {
                const systemMessage = { role: "system", content: BASE_PROMPT_HEADER + BASE_PROMPT_FOOTER };
                const userContent = [{ type: "text", text: dynamicPrompt + JSON.stringify(openPhoneData, null, 2) }];
                imagePayloads.forEach(p => userContent.push({ type: "image_url", image_url: { url: p.dataUrl } }));
                const userMessage = { role: "user", content: userContent };
                const openaiPayload = { model: modelName, messages: [systemMessage, userMessage], max_tokens: 4096 };
                showToast(`Sending data to ${modelName.toUpperCase()}...`);
                const openaiFetchResponse = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiApiKey}` }, body: JSON.stringify(openaiPayload) });
                if (!openaiFetchResponse.ok) throw new Error(`OpenAI API Error: ${await openaiFetchResponse.text()}`);
                const openaiResponse = await openaiFetchResponse.json();
                responseText = openaiResponse.choices?.[0]?.message?.content;
                // Harmonize history for our chat modal which expects the Gemini format
                initialHistory = [
                    { role: 'user', parts: [{ text: userContent.find(c=>c.type==='text').text }] }, // Simplified for chat history
                    { role: 'model', parts: [{ text: responseText }] }
                ];
            }
            if (!responseText) throw new Error("AI response was empty or in an unexpected format.");
            showChatModal(initialHistory, finalFilename, modelName);
            
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
        settingsButton.onclick = manageApiKeys; 
        container.appendChild(mainButton);
        container.appendChild(settingsButton);
        document.body.appendChild(container);
        console.log("✅ Floating AI Summarizer button added.");
    };

    console.log("🚀 Initializing OpenPhone AI Summarizer v30...");
    injectStyles();
    createFloatingButton();
})();
