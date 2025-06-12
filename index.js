// ==Bookmarklet Script==
// @name         OpenPhone Gemini Summarizer (Analyst Edition)
// @description  Click a message timestamp to trigger a point-in-time summary with advanced API options and raw data download.
// @version      20.0
// @author       ilakskills
// ==/Bookmarklet Script==

(() => {
    // --- MASTER PROMPT & CONFIGURATION ---
    const PROMPT_SECTIONS = { title:`Title:\n...`,attendees:`Attendees:\n...`,project_topic:`Project/Topic:\n...`,discussion_points:`Content/Key Discussion Points:\n...`,decisions:`Decisions Made:\n...`,action_items:`Follow-Up Tasks / Action Items:\n...`,notes:`Notes/Observations (Optional):\n...`,quick_summary:`Quick Summary: ...`,quick_next_steps:`Quick Next Steps: ...`,disclaimer:`Disclaimer:\n...`};
    const BASE_PROMPT_HEADER = `Goal:\nTransform a potentially messy conversation log...`;
    const BASE_PROMPT_FOOTER = `? How I Work:\nSynthesize & Consolidate...`;
    const API_KEY_STORAGE_NAME = 'gemini_api_key_storage';
    
    // --- SVG Icons ---
    const settingsIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path fill="currentColor" d="M10.667 1.875A.833.833 0 0 0 10 1.25a.833.833 0 0 0-.667.625l-.234.937a5.218 5.218 0 0 0-1.593.84l-.87-.39a.833.833 0 0 0-.933.277L4.29 5.293a.833.833 0 0 0 .278.933l.794.516a5.233 5.233 0 0 0 0 1.916l-.794.516a.833.833 0 0 0-.278.933l1.414 1.414a.833.833 0 0 0 .933.278l.87-.39c.47.318.99.577 1.592.839l.234.937A.833.833 0 0 0 10 18.75a.833.833 0 0 0 .667-.625l.234-.937c.603-.262 1.122-.521 1.593-.84l.87.39a.833.833 0 0 0 .933-.277l1.414-1.414a.833.833 0 0 0-.278-.933l-.794-.516a5.233 5.233 0 0 0 0-1.916l.794-.516a.833.833 0 0 0 .278-.933L15.707 3.88a.833.833 0 0 0-.933-.278l-.87.39a5.218 5.218 0 0 0-1.592-.84l-.234-.937zM10 12.5a2.5 2.5 0 1 1 0-5a2.5 2.5 0 0 1 0 5z"></path></svg>`;
    const sendIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path fill="currentColor" d="M2.525 2.525a.75.75 0 0 1 .91-.073l13.5 6.75a.75.75 0 0 1 0 1.196l-13.5 6.75a.75.75 0 0 1-1.002-1.123L3.89 10 2.433 3.571a.75.75 0 0 1 .092-1.046z"></path></svg>`;

    // --- UI HELPER FUNCTIONS ---
    const injectStyles=()=>{const e="gemini-summarizer-styles";if(document.getElementById(e))return;const t=document.createElement("style");t.id=e,t.innerHTML=`\n            .gemini-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center; }\n            .gemini-modal-content { background-color: white; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.25); width: 90%; max-width: 800px; max-height: 90vh; display: flex; flex-direction: column; }\n            .gemini-modal-header { padding: 16px; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center; } .gemini-modal-header h2 { margin: 0; font-size: 18px; color: #333; }\n            .gemini-modal-close { font-size: 24px; font-weight: bold; cursor: pointer; color: #888; border: none; background: none; }\n            .gemini-modal-body { padding: 16px; overflow-y: auto; font-family: sans-serif; background-color: #fff; flex-grow: 1; line-height: 1.5; white-space: normal; }\n            .gemini-modal-footer { padding: 12px 16px; border-top: 1px solid #e0e0e0; display: flex; gap: 10px; justify-content: space-between; align-items: center; }\n            .gemini-modal-button { padding: 8px 16px; border-radius: 6px; border: 1px solid #ccc; background-color: #f0f0f0; cursor: pointer; font-weight: 500; } .gemini-modal-button:hover { background-color: #e0e0e0; } .gemini-modal-button.primary { background-color: #007bff; color: white; border-color: #007bff; } .gemini-modal-button.primary:hover { background-color: #0056b3; }\n            .gemini-toast { position: fixed; top: 20px; right: 20px; background-color: #333; color: white; padding: 12px 20px; border-radius: 6px; z-index: 10001; font-size: 14px; transition: opacity 0.5s; opacity: 1; }\n            .settings-section { margin-bottom: 20px; } .settings-section h3 { margin:0 0 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; } .settings-section label { display: block; margin-bottom: 5px; font-weight: bold; }\n            .settings-section input { width: 100%; padding: 8px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; }\n            .sections-grid, .api-params-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }\n            .chat-log { display: flex; flex-direction: column; gap: 12px; font-family: sans-serif; } .message-bubble { padding: 10px 14px; border-radius: 18px; max-width: 80%; line-height: 1.5; white-space: pre-wrap; word-break: break-word; } .message-bubble.user { background-color: #007bff; color: white; align-self: flex-end; } .message-bubble.model { background-color: #e9e9eb; color: #1c1c1e; align-self: flex-start; } .message-bubble.loading { align-self: flex-start; } .message-bubble.error { background-color: #ffcccc; color: #a00; }\n            .chat-input-form { display: flex; gap: 10px; padding: 10px 16px; border-top: 1px solid #e0e0e0; } #chat-input { flex-grow: 1; padding: 10px; border: 1px solid #ccc; border-radius: 20px; } #chat-send-btn { background: #007bff; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }\n        `,document.head.appendChild(t)};
    const showToast=(e,t="success")=>{const o=document.createElement("div");o.className=`gemini-toast ${t}`,o.textContent=e,document.body.appendChild(o),setTimeout(()=>{o.style.opacity="0",setTimeout(()=>o.remove(),500)},3e3)};
    const showApiKeyModal=()=>{const e=document.createElement("div");e.className="gemini-modal-overlay settings-modal";const t=localStorage.getItem(API_KEY_STORAGE_NAME)||"";e.innerHTML=`<div class="gemini-modal-content" style="max-width:500px"><div class="gemini-modal-header"><h2>API Key Settings</h2><button class="gemini-modal-close">×</button></div><div class="gemini-modal-body"><div class="settings-section"><label for="apiKey">Gemini API Key</label><input type="text" id="apiKey" value="${t}" placeholder="Enter your key here"><p style="font-size:12px;color:#666;margin-top:8px">Your key is stored in your browser's local storage.</p></div></div><div class="gemini-modal-footer"><button class="gemini-modal-button primary" id="save-key">Save Key</button></div></div>`,document.body.appendChild(e);const o=()=>e.remove();e.querySelector(".gemini-modal-close").addEventListener("click",o),e.querySelector("#save-key").addEventListener("click",()=>{const t=e.querySelector("#apiKey").value.trim();t?(localStorage.setItem(API_KEY_STORAGE_NAME,t),showToast("API Key saved successfully!"),o()):(localStorage.removeItem(API_KEY_STORAGE_NAME),showToast("API Key cleared.","error"),o())})};
    const showChatModal=(e,t)=>{let o=[...e];const n=document.createElement("div");n.className="gemini-modal-overlay chat-modal",n.innerHTML=`<div class="gemini-modal-content"><div class="gemini-modal-header"><h2>AI Summary & Refinement</h2><button class="gemini-modal-close">×</button></div><div class="gemini-modal-body"><div class="chat-log"></div></div><form class="chat-input-form"><input type="text" id="chat-input" placeholder="Refine the summary..." autocomplete="off"><button type="submit" id="chat-send-btn" title="Send">${sendIconSVG}</button></form><div class="gemini-modal-footer"><button class="gemini-modal-button download-btn">Download Last</button><button class="gemini-modal-button primary copy-btn">Copy Last</button></div></div>`,document.body.appendChild(n);const s=n.querySelector(".chat-log"),i=n.querySelector("#chat-input"),r=n.querySelector(".chat-input-form"),l=()=>n.remove(),a=n.querySelector(".gemini-modal-close"),c=n.querySelector(".copy-btn"),d=n.querySelector(".download-btn"),u=(e,t)=>{const o=document.createElement("div");return o.className=`message-bubble ${e}`,o.textContent=t,s.appendChild(o),s.scrollTop=s.scrollHeight,o},m=o.find(e=>"model"===e.role)?.parts[0]?.text;m&&u("model",m);const p=async e=>{u("user",e),i.value="";const t=u("model loading","...");o.push({role:"user",parts:[{text:e}]});try{const e=localStorage.getItem(API_KEY_STORAGE_NAME),s={contents:o},n=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${e}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(s)});if(!n.ok)throw new Error(`API Error: ${await n.text()}`);const i=await n.json(),r=i.candidates?.[0]?.content?.parts?.[0]?.text;if(!r)throw new Error("Received an empty response from AI.");o.push({role:"model",parts:[{text:r}]}),t.remove(),u("model",r)}catch(e){t.remove(),u("error",`Error: ${e.message}`),console.error(e)}};r.addEventListener("submit",e=>{e.preventDefault();const t=i.value.trim();t&&p(t)}),a.addEventListener("click",l),c.addEventListener("click",()=>{const e=s.querySelector(".message-bubble.model:last-child");e&&navigator.clipboard.writeText(e.textContent).then(()=>showToast("Copied to clipboard!"))}),d.addEventListener("click",()=>{const e=s.querySelector(".message-bubble.model:last-child");if(e){const o=new Blob([e.textContent],{type:"text/plain;charset=utf-8"}),s=document.createElement("a");s.href=URL.createObjectURL(o),s.download=t,s.click(),URL.revokeObjectURL(s.href)}})};
    const showExecutionOptionsModal = (conversationId, activityId) => {
        const overlay = document.createElement('div');
        overlay.className = 'gemini-modal-overlay options-modal';
        const sectionsHtml = Object.keys(PROMPT_SECTIONS).map(key => `<label><input type="checkbox" name="section" value="${key}" checked>${key.replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase())}</label>`).join('');

        overlay.innerHTML = `
            <div class="gemini-modal-content">
                <div class="gemini-modal-header"><h2>Generate Summary Options</h2><button class="gemini-modal-close">×</button></div>
                <div class="gemini-modal-body">
                    <div class="settings-section">
                        <h3>API Parameters (for debugging)</h3>
                        <div class="api-params-grid">
                            <div><label for="param-last">Last:</label><input type="number" id="param-last" value="51"></div>
                            <div><label for="param-next">Next:</label><input type="number" id="param-next" value="1"></div>
                        </div>
                    </div>
                    <div class="settings-section">
                        <h3>Output Sections</h3>
                        <div class="sections-grid">${sectionsHtml}</div>
                    </div>
                </div>
                <div class="gemini-modal-footer">
                    <div><button class="gemini-modal-button" id="download-raw">Download Raw API Data</button></div>
                    <div>
                        <button class="gemini-modal-button" id="cancel-run">Cancel</button>
                        <button class="gemini-modal-button primary" id="generate-summary">Generate Summary</button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(overlay);

        const closeModal = () => overlay.remove();
        const lastInput = overlay.querySelector('#param-last');
        const nextInput = overlay.querySelector('#param-next');

        overlay.querySelector('.gemini-modal-close').addEventListener('click', closeModal);
        overlay.querySelector('#cancel-run').addEventListener('click', closeModal);
        
        overlay.querySelector('#generate-summary').addEventListener('click', () => {
            const last = lastInput.value;
            const next = nextInput.value;
            const selectedSections = Array.from(overlay.querySelectorAll('input[name="section"]:checked')).map(el => el.value);
            closeModal();
            runSummaryProcess(conversationId, activityId, last, next, selectedSections);
        });

        overlay.querySelector('#download-raw').addEventListener('click', async () => {
            const last = lastInput.value;
            const next = nextInput.value;
            showToast("Fetching raw data...", 'success');
            closeModal();
            try {
                const authToken = await getAuthToken();
                const apiUrl = `https://communication.openphoneapi.com/v2/activity?id=${conversationId}&next=${next}&last=${last}&before=${activityId}`;
                const response = await fetch(apiUrl, { headers: { 'Authorization': authToken }});
                if (!response.ok) throw new Error(`API Error ${response.status}`);
                const data = await response.json();
                
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `raw_data_${conversationId}_${activityId}.json`;
                link.click();
                URL.revokeObjectURL(link.href);
            } catch (err) {
                showToast(`Failed to download raw data: ${err.message}`, 'error');
                console.error(err);
            }
        });
    };

    // --- CORE LOGIC ---
    const getAuthToken=()=>{return new Promise((e,t)=>{let o=null;const n=window.fetch,s=XMLHttpRequest.prototype.setRequestHeader;const i=()=>{window.fetch=n,XMLHttpRequest.prototype.setRequestHeader=s};window.fetch=function(...e){const t=e[1]?.headers;return t&&(t.Authorization||t.authorization)&&(o=t.Authorization||t.authorization),n.apply(this,e)},XMLHttpRequest.prototype.setRequestHeader=function(e,t){return"authorization"===e.toLowerCase()&&(o=t),s.apply(this,arguments)};let r=0;const l=setInterval(()=>{o?(clearInterval(l),i(),e(o)):r++>150&&(clearInterval(l),i(),t(new Error("Auth token timeout.")))},100)})};
    const generateUsefulFilename=e=>{const t=new Date,o=e=>e.toString().padStart(2,"0"),n=`${t.getFullYear()}-${o(t.getMonth()+1)}-${o(t.getDate())}_${o(t.getHours())}-${o(t.getMinutes())}`;let s=document.querySelector('[data-test-id="conversation-header-title"]');return s=s&&s.textContent.trim()?s.textContent.trim().replace(/[^\w\s-]/g,"").trim().replace(/\s+/g,"-"):e,`${n}_${s}_OpenPhone_Summary.txt`};
    const buildDynamicPrompt=e=>{let t="";return e.forEach(e=>{PROMPT_SECTIONS[e]&&(t+=PROMPT_SECTIONS[e]+"\n")}),BASE_PROMPT_HEADER+t+BASE_PROMPT_FOOTER};
    const runSummaryProcess=async(conversationId,activityId,last,next,selectedSections)=>{const apiKey=localStorage.getItem(API_KEY_STORAGE_NAME);if(!apiKey)return void showToast("API Key not set. Please use settings (gear icon).","error");showToast("Starting summary process...","success");try{const authToken=await getAuthToken(),openPhoneApiUrl=`https://communication.openphoneapi.com/v2/activity?id=${conversationId}&next=${next}&last=${last}&before=${activityId}`,apiResponse=await fetch(openPhoneApiUrl,{headers:{Authorization:authToken}});if(!apiResponse.ok)throw new Error(`OpenPhone API request failed: ${apiResponse.status}`);const openPhoneData=await apiResponse.json();if(0===openPhoneData.result.length)return void showToast("No activities found before the selected message.","error");const dynamicPrompt=buildDynamicPrompt(selectedSections),imageParts=[],textPart={text:dynamicPrompt+JSON.stringify(openPhoneData,null,2)},imageActivities=openPhoneData.result.filter(e=>e.media?.some(e=>e.type.startsWith("image/")));if(imageActivities.length>0){showToast(`Found ${imageActivities.length} image(s). Fetching...`);const urlToPart=async e=>{try{const t=await fetch(e.url);if(!t.ok)throw new Error(`Failed to fetch image: ${t.statusText}`);const o=await t.blob();return new Promise((t,n)=>{const s=new FileReader;s.onloadend=()=>{const e=s.result.split(",")[1];t({inlineData:{mimeType:o.type,data:e}})},s.onerror=n,s.readAsDataURL(o)})}catch(t){return console.error(`Skipping image ${e.url} due to error:`,t),null}},imagePromises=imageActivities.flatMap(e=>e.media.map(urlToPart));const resolvedParts=await Promise.all(imagePromises);imageParts.push(...resolvedParts.filter(e=>null!==e))}const initialUserPayload={role:"user",parts:[textPart,...imageParts]},geminiApiUrl=`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,geminiPayload={contents:[initialUserPayload]};showToast("Sending initial data to Gemini...");const geminiFetchResponse=await fetch(geminiApiUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(geminiPayload)});if(!geminiFetchResponse.ok)throw new Error(`Gemini API request failed: ${await geminiFetchResponse.text()}`);const geminiResponse=await geminiFetchResponse.json(),geminiResponseText=geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text;if(!geminiResponseText)throw new Error("Gemini response was empty or in an unexpected format.");const finalFilename=generateUsefulFilename(conversationId),chatHistory=[initialUserPayload,{role:"model",parts:[{text:geminiResponseText}]}];showChatModal(chatHistory,finalFilename)}catch(err){console.error("❌ An error occurred:",err),showToast(err.message,"error")}};
    
    // --- UI INJECTION & OBSERVER LOGIC ---
    const initMasterObserver = () => {
        let settingsButtonAdded = false;
        
        const masterObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== 1) continue;

                    // Add settings button to quick actions bar (only once)
                    if (!settingsButtonAdded) {
                        const quickActionsBar = node.id === 'message-quick-actions' ? node : node.querySelector('#message-quick-actions');
                        if (quickActionsBar) {
                            addSettingsButton(quickActionsBar);
                            settingsButtonAdded = true;
                        }
                    }
                }
            }
        });

        // The click listener is now global, so we attach it once
        document.body.addEventListener('click', (event) => {
            // Target the specific timestamp links
            const timestampLink = event.target.closest('a._64dp6m13._64dp6m15');
            if (timestampLink) {
                event.preventDefault();
                event.stopPropagation();
                
                const href = timestampLink.getAttribute('href');
                if (!href) return;

                const convoIdMatch = href.match(/c\/(CN[a-zA-Z0-9]+)/);
                const activityIdMatch = href.match(/at=(AC[a-zA-Z0-9]+)/);

                if (convoIdMatch && activityIdMatch) {
                    const conversationId = convoIdMatch[1];
                    const activityId = activityIdMatch[1];
                    showExecutionOptionsModal(conversationId, activityId);
                } else {
                    showToast("Could not parse IDs from timestamp link.", "error");
                }
            }
        }, true); // Use capture phase to catch the event early

        masterObserver.observe(document.body, { childList: true, subtree: true });
        console.log("🚀 Summarizer initialized. Click a message timestamp to start.");
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
    
    // --- SCRIPT INITIALIZATION ---
    injectStyles();
    initMasterObserver();
})();