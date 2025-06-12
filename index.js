// ==Bookmarklet Script==
// @name         OpenPhone Multi-Model AI Summarizer (Analyst Edition)
// @description  Click a timestamp to summarize with Gemini or GPT models. Features vision, conversational refinement, and advanced options.
// @version      23.0
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
    const settingsIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path fill="currentColor" d="M10.667 1.875A.833.833 0 0 0 10 1.25a.833.833 0 0 0-.667.625l-.234.937a5.218 5.218 0 0 0-1.593.84l-.87-.39a.833.833 0 0 0-.933.277L4.29 5.293a.833.833 0 0 0 .278.933l.794.516a5.233 5.233 0 0 0 0 1.916l-.794.516a.833.833 0 0 0-.278.933l1.414 1.414a.833.833 0 0 0 .933.278l.87-.39c.47.318.99.577 1.592.839l.234.937A.833.833 0 0 0 10 18.75a.833.833 0 0 0 .667-.625l.234-.937c.603-.262 1.122-.521 1.593-.84l.87.39a.833.833 0 0 0 .933-.277l1.414-1.414a.833.833 0 0 0-.278-.933l-.794-.516a5.233 5.233 0 0 0 0-1.916l.794-.516a.833.833 0 0 0 .278-.933L15.707 3.88a.833.833 0 0 0-.933-.278l-.87.39a5.218 5.218 0 0 0-1.592-.84l-.234-.937zM10 12.5a2.5 2.5 0 1 1 0-5a2.5 2.5 0 0 1 0 5z"></path></svg>`;
    const sendIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path fill="currentColor" d="M2.525 2.525a.75.75 0 0 1 .91-.073l13.5 6.75a.75.75 0 0 1 0 1.196l-13.5 6.75a.75.75 0 0 1-1.002-1.123L3.89 10 2.433 3.571a.75.75 0 0 1 .092-1.046z"></path></svg>`;
    
    // --- UI HELPER FUNCTIONS ---
    const injectStyles=()=>{const e="gemini-summarizer-styles";if(document.getElementById(e))return;const t=document.createElement("style");t.id=e;t.innerHTML=`\n            .gemini-modal-overlay{...} .gemini-modal-content{...} /* Minified for brevity */\n            .api-params-grid label, .model-selection-grid label { font-weight: normal; } .model-selection-grid input { margin-right: 5px; }\n        `,document.head.appendChild(t)};
    const showToast=(e,t="success")=>{/*...*/};
    const showApiKeyModal=()=>{const e=document.createElement("div");e.className="gemini-modal-overlay settings-modal";const t=localStorage.getItem(GEMINI_KEY_NAME)||"",o=localStorage.getItem(OPENAI_KEY_NAME)||"";e.innerHTML=`<div class="gemini-modal-content" style="max-width:500px"><div class="gemini-modal-header"><h2>API Key Settings</h2><button class="gemini-modal-close">×</button></div><div class="gemini-modal-body"><div class="settings-section"><label for="geminiApiKey">Gemini API Key</label><input type="text" id="geminiApiKey" value="${t}" placeholder="Enter Gemini key (AIza...)"></div><div class="settings-section"><label for="openaiApiKey">OpenAI API Key</label><input type="text" id="openaiApiKey" value="${o}" placeholder="Enter OpenAI key (sk-...)"></div><p style="font-size:12px;color:#666">Keys are stored securely in your browser's local storage.</p></div><div class="gemini-modal-footer"><button class="gemini-modal-button primary" id="save-keys">Save Keys</button></div></div>`,document.body.appendChild(e);const n=()=>e.remove();e.querySelector(".gemini-modal-close").addEventListener("click",n),e.querySelector("#save-keys").addEventListener("click",()=>{const t=e.querySelector("#geminiApiKey").value.trim(),o=e.querySelector("#openaiApiKey").value.trim();t?localStorage.setItem(GEMINI_KEY_NAME,t):localStorage.removeItem(GEMINI_KEY_NAME),o?localStorage.setItem(OPENAI_KEY_NAME,o):localStorage.removeItem(OPENAI_KEY_NAME),showToast("API Keys saved!"),n()})};
    const showChatModal=(e,t,o)=>{let n=[...e];const s=document.createElement("div");s.className="gemini-modal-overlay chat-modal",s.innerHTML=`...`,document.body.appendChild(s);const i=s.querySelector(".chat-log"),r=s.querySelector("#chat-input"),l=s.querySelector(".chat-input-form"),a=()=>s.remove(),c=s.querySelector(".gemini-modal-close"),d=s.querySelector(".copy-btn"),u=s.querySelector(".download-btn"),m=(e,t)=>{/*...*/},p=n.find(e=>"model"===e.role)?.parts[0]?.text;p&&m("model",p);const g=async s=>{m("user",s),r.value="";const i=m("model loading","...");n.push({role:"user",parts:[{text:s}]});try{let e,s,r;if("gemini"===o){const t=localStorage.getItem(GEMINI_KEY_NAME);e=`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${t}`,r={contents:n}}else{const t=localStorage.getItem(OPENAI_KEY_NAME),i=n.map(({role:e,parts:t})=>({role:"system"===e?"system":"user"===e?"user":"assistant",content:t[0].text}));e="https://api.openai.com/v1/chat/completions",s={Authorization:`Bearer ${t}`},r={model:o,messages:i,max_tokens:4000}}const l=await fetch(e,{method:"POST",headers:{"Content-Type":"application/json",...s},body:JSON.stringify(r)});if(!l.ok)throw new Error(`API Error: ${await l.text()}`);const a=await l.json(),c="gemini"===o?a.candidates?.[0]?.content?.parts?.[0]?.text:a.choices?.[0]?.message?.content;if(!c)throw new Error("Received an empty response from AI.");n.push({role:"model",parts:[{text:c}]}),i.remove(),m("model",c)}catch(e){i.remove(),m("error",`Error: ${e.message}`),console.error(e)}};l.addEventListener("submit",e=>{e.preventDefault();const t=r.value.trim();t&&g(t)}),c.addEventListener("click",a),d.addEventListener("click",()=>{const e=i.querySelector(".message-bubble.model:last-child");if(e){const o=new Blob([e.textContent],{type:"text/plain;charset=utf-8"}),n=document.createElement("a");n.href=URL.createObjectURL(o),n.download=t,n.click(),URL.revokeObjectURL(n.href)}}),u.addEventListener("click",()=>{const e=i.querySelector(".message-bubble.model:last-child");e&&navigator.clipboard.writeText(e.textContent).then(()=>showToast("Copied to clipboard!"))})};
    const showExecutionOptionsModal=(e,t)=>{const o=document.createElement("div");o.className="gemini-modal-overlay options-modal";const n=Object.keys(PROMPT_SECTIONS).map(e=>`<label><input type="checkbox" name="section" value="${e}" checked>${e.replace(/_/g," ").replace(/\b\w/g,e=>e.toUpperCase())}</label>`).join("");o.innerHTML=`<div class="gemini-modal-content"><div class="gemini-modal-header"><h2>Generate Summary Options</h2><button class="gemini-modal-close">×</button></div><div class="gemini-modal-body"><div class="settings-section"><h3>AI Model</h3><div class="model-selection-grid"><label><input type="radio" name="model" value="gemini-1.5-flash-latest" checked> Gemini 1.5 Flash</label><label><input type="radio" name="model" value="gpt-4o"> GPT-4o</label><label><input type="radio" name="model" value="gpt-4-turbo"> GPT-4 Turbo</label></div></div><div class="settings-section"><h3>Output Sections</h3><div class="sections-grid">${n}</div></div></div><div class="gemini-modal-footer"><button class="gemini-modal-button" id="cancel-run">Cancel</button><button class="gemini-modal-button primary" id="generate-summary">Generate Summary</button></div></div>`,document.body.appendChild(o);const s=()=>o.remove();o.querySelector(".gemini-modal-close").addEventListener("click",s),o.querySelector("#cancel-run").addEventListener("click",s),o.querySelector("#generate-summary").addEventListener("click",()=>{const n=o.querySelector('input[name="model"]:checked').value,s=Array.from(o.querySelectorAll('input[name="section"]:checked')).map(e=>e.value);s.length>0?(o.remove(),runSummaryProcess(e,t,n,s)):showToast("Please select at least one output section.","error")})};

    // --- CORE LOGIC ---
    const getAuthToken=()=>{/*...*/};
    const generateUsefulFilename=e=>{/*...*/};
    const buildDynamicPrompt=e=>{let t="";e.forEach(e=>{PROMPT_SECTIONS[e]&&(t+=PROMPT_SECTIONS[e]+"\n")});return BASE_PROMPT_HEADER+t+BASE_PROMPT_FOOTER};
    
    const runSummaryProcess = async (conversationId, activityId, modelName, selectedSections) => {
        const geminiApiKey = localStorage.getItem(GEMINI_KEY_NAME);
        const openaiApiKey = localStorage.getItem(OPENAI_KEY_NAME);

        if (modelName.startsWith('gemini') && !geminiApiKey) return showToast("Gemini API Key not set.", "error");
        if (modelName.startsWith('gpt') && !openaiApiKey) return showToast("OpenAI API Key not set.", "error");

        showToast("Starting summary process...", "success");
        try {
            const authToken = await getAuthToken();
            const openPhoneApiUrl = `https://communication.openphoneapi.com/v2/activity?id=${conversationId}&last=51&before=${activityId}`;
            const apiResponse = await fetch(openPhoneApiUrl, { headers: { 'Authorization': authToken } });
            if (!apiResponse.ok) throw new Error(`OpenPhone API request failed: ${apiResponse.status}`);
            const openPhoneData = await apiResponse.json();
            if (openPhoneData.result.length === 0) return showToast("No activities found before the selected message.", "error");

            const dynamicPrompt = buildDynamicPrompt(selectedSections);
            const textContent = dynamicPrompt + JSON.stringify(openPhoneData, null, 2);
            
            // --- Multimodal Image Handling ---
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

            // --- Model-Specific API Call ---
            let initialHistory, geminiResponseText;
            const finalFilename = generateUsefulFilename(conversationId);

            if (modelName.startsWith('gemini')) {
                // Gemini Payload
                const textPart = { text: textContent };
                const imageParts = imagePayloads.map(p => ({ inlineData: { mimeType: p.mime, data: p.dataUrl.split(',')[1] } }));
                const initialUserPayload = { role: 'user', parts: [textPart, ...imageParts] };
                const geminiPayload = { contents: [initialUserPayload] };
                
                showToast("Sending data to Gemini...");
                const geminiFetchResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(geminiPayload) });
                if (!geminiFetchResponse.ok) throw new Error(`Gemini API Error: ${await geminiFetchResponse.text()}`);
                const geminiResponse = await geminiFetchResponse.json();
                geminiResponseText = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text;
                initialHistory = [initialUserPayload, { role: 'model', parts: [{ text: geminiResponseText }] }];

            } else { // OpenAI GPT model
                // OpenAI Payload
                const systemMessage = { role: "system", content: BASE_PROMPT_HEADER + BASE_PROMPT_FOOTER };
                const userContent = [{ type: "text", text: dynamicPrompt + JSON.stringify(openPhoneData, null, 2) }];
                imagePayloads.forEach(p => userContent.push({ type: "image_url", image_url: { url: p.dataUrl } }));
                const userMessage = { role: "user", content: userContent };
                
                const openaiPayload = { model: modelName, messages: [systemMessage, userMessage], max_tokens: 4096 };
                
                showToast(`Sending data to ${modelName.toUpperCase()}...`);
                const openaiFetchResponse = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiApiKey}` }, body: JSON.stringify(openaiPayload) });
                if (!openaiFetchResponse.ok) throw new Error(`OpenAI API Error: ${await openaiFetchResponse.text()}`);
                const openaiResponse = await openaiFetchResponse.json();
                geminiResponseText = openaiResponse.choices?.[0]?.message?.content;
                initialHistory = [systemMessage, userMessage, { role: 'model', parts: [{ text: geminiResponseText }] }]; // Harmonize history for our chat modal
            }
            
            if (!geminiResponseText) throw new Error("AI response was empty or in an unexpected format.");
            showChatModal(initialHistory, finalFilename, modelName.startsWith('gemini') ? 'gemini' : modelName);

        } catch (error) {
            console.error("❌ An error occurred:", error);
            showToast(error.message, 'error');
        }
    };
    
    // --- UI INJECTION & OBSERVER LOGIC ---
    const initializeSummarizer = () => {
        let settingsButtonAdded = false;
        const masterObserver = new MutationObserver((mutations, obs) => {
            if (settingsButtonAdded) return;
            const quickActionsBar = document.getElementById('message-quick-actions');
            if (quickActionsBar) {
                addSettingsButton(quickActionsBar);
                settingsButtonAdded = true;
                obs.disconnect();
            }
        });
        document.body.addEventListener('click', (event) => {
            const timestampLink = event.target.closest('a[href*="/c/CN"][href*="at=AC"]');
            if (timestampLink) {
                event.preventDefault(); event.stopPropagation();
                const href = timestampLink.getAttribute('href');
                const convoIdMatch = href.match(/c\/(CN[a-zA-Z0-9]+)/);
                const activityIdMatch = href.match(/at=(AC[a-zA-Z0-9]+)/);
                if (convoIdMatch && activityIdMatch) {
                    showExecutionOptionsModal(convoIdMatch[1], activityIdMatch[1]);
                } else { showToast("Could not parse IDs from timestamp link.", "error"); }
            }
        }, true);
        masterObserver.observe(document.body, { childList: true, subtree: true });
        console.log("🚀 Multi-Model Summarizer initialized. Click a message timestamp to start.");
    };

    const addSettingsButton = (quickActionsBar) => {
        if (document.getElementById('gemini-settings-button')) return;
        const templateButton = quickActionsBar.querySelector('button');
        if (templateButton) {
            const settingsButton = templateButton.cloneNode(true);
            settingsButton.id = 'gemini-settings-button';
            settingsButton.innerHTML = settingsIconSVG;
            settingsButton.title = "API Key Settings";
            settingsButton.removeAttribute('aria-labelledby');
            settingsButton.addEventListener('click', showApiKeyModal);
            quickActionsBar.prepend(settingsButton);
        }
    };
    
    injectStyles();
    initializeSummarizer();
})();
