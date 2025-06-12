// ==Bookmarklet Script==
// @name         OpenPhone Gemini Summarizer (Time-Processor)
// @description  Adds a timestamp-click trigger for point-in-time summaries with client-side UTC-to-CT time conversion and date filtering.
// @version      21.0
// @author       ilakskills
// ==/Bookmarklet Script==

(() => {
    // --- MASTER PROMPT & CONFIGURATION ---
    const PROMPT_SECTIONS = { title:`Title:\n...`,attendees:`Attendees:\n...`,project_topic:`Project/Topic:\n...`,discussion_points:`Content/Key Discussion Points:\n...`,decisions:`Decisions Made:\n...`,action_items:`Follow-Up Tasks / Action Items:\n...`,notes:`Notes/Observations (Optional):\n...`,quick_summary:`Quick Summary: ...`,quick_next_steps:`Quick Next Steps: ...`,disclaimer:`Disclaimer:\n...`};
    const BASE_PROMPT_HEADER = `Goal:\nTransform a potentially messy conversation log...`;
    const BASE_PROMPT_FOOTER = `? How I Work:\nSynthesize & Consolidate...`;
    const API_KEY_STORAGE_NAME = 'gemini_api_key_storage';
    
    // --- SVG Icons & UI ---
    const settingsIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path fill="currentColor" d="M10.667 1.875A.833.833 0 0 0 10 1.25a.833.833 0 0 0-.667.625l-.234.937a5.218 5.218 0 0 0-1.593.84l-.87-.39a.833.833 0 0 0-.933.277L4.29 5.293a.833.833 0 0 0 .278.933l.794.516a5.233 5.233 0 0 0 0 1.916l-.794.516a.833.833 0 0 0-.278.933l1.414 1.414a.833.833 0 0 0 .933.278l.87-.39c.47.318.99.577 1.592.839l.234.937A.833.833 0 0 0 10 18.75a.833.833 0 0 0 .667-.625l.234-.937c.603-.262 1.122-.521 1.593-.84l.87.39a.833.833 0 0 0 .933-.277l1.414-1.414a.833.833 0 0 0-.278-.933l-.794-.516a5.233 5.233 0 0 0 0-1.916l.794-.516a.833.833 0 0 0 .278-.933L15.707 3.88a.833.833 0 0 0-.933-.278l-.87.39a5.218 5.218 0 0 0-1.592-.84l-.234-.937zM10 12.5a2.5 2.5 0 1 1 0-5a2.5 2.5 0 0 1 0 5z"></path></svg>`;
    const sendIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path fill="currentColor" d="M2.525 2.525a.75.75 0 0 1 .91-.073l13.5 6.75a.75.75 0 0 1 0 1.196l-13.5 6.75a.75.75 0 0 1-1.002-1.123L3.89 10 2.433 3.571a.75.75 0 0 1 .092-1.046z"></path></svg>`;
    const injectStyles=()=>{const e="gemini-summarizer-styles";if(document.getElementById(e))return;const t=document.createElement("style");t.id=e,t.innerHTML=`\n            .gemini-modal-overlay { ... } .gemini-modal-content { ... } /* Minified for brevity */\n            .gemini-modal-button.active { border-color: #007bff; background-color: #cce5ff; }\n        `,document.head.appendChild(t)};
    const showToast=(e,t="success")=>{const o=document.createElement("div");o.className=`gemini-toast ${t}`,o.textContent=e,document.body.appendChild(o),setTimeout(()=>{o.style.opacity="0",setTimeout(()=>o.remove(),500)},3e3)};
    const showApiKeyModal=()=>{const e=document.createElement("div");e.className="gemini-modal-overlay settings-modal",e.innerHTML=`...`,document.body.appendChild(e);/* ... */};
    const showChatModal=(e,t)=>{/* ... */};

    // --- NEW: On-Demand Options Modal with Date Filters ---
    const showExecutionOptionsModal = (conversationId, activityId) => {
        const overlay = document.createElement('div');
        overlay.className = 'gemini-modal-overlay options-modal';
        const sectionsHtml = Object.keys(PROMPT_SECTIONS).map(key => `<label><input type="checkbox" name="section" value="${key}" checked>${key.replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase())}</label>`).join('');

        overlay.innerHTML = `
            <div class="gemini-modal-content">
                <div class="gemini-modal-header"><h2>Generate Summary Options</h2><button class="gemini-modal-close">×</button></div>
                <div class="gemini-modal-body">
                    <div class="settings-section">
                        <h3>Date Filter (relative to Central Time)</h3>
                        <div class="date-filters">
                            <button class="gemini-modal-button" data-filter="today">Today</button>
                            <button class="gemini-modal-button" data-filter="yesterday">Yesterday</button>
                            <button class="gemini-modal-button" data-filter="week">Current Week</button>
                            <button class="gemini-modal-button active" data-filter="all">All Available</button>
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
            const selectedSections = Array.from(overlay.querySelectorAll('input[name="section"]:checked')).map(el => el.value);
            closeModal();
            runSummaryProcess(conversationId, activityId, activeFilter, selectedSections);
        });
    };
    
    // --- CORE LOGIC & HELPERS ---
    const getAuthToken=()=>{return new Promise((e,t)=>{let o=null;const n=window.fetch,s=XMLHttpRequest.prototype.setRequestHeader;const i=()=>{window.fetch=n,XMLHttpRequest.prototype.setRequestHeader=s};window.fetch=function(...e){const t=e[1]?.headers;return t&&(t.Authorization||t.authorization)&&(o=t.Authorization||t.authorization),n.apply(this,e)},XMLHttpRequest.prototype.setRequestHeader=function(e,t){return"authorization"===e.toLowerCase()&&(o=t),s.apply(this,arguments)};let r=0;const l=setInterval(()=>{o?(clearInterval(l),i(),e(o)):r++>150&&(clearInterval(l),i(),t(new Error("Auth token timeout.")))},100)})};
    const generateUsefulFilename=e=>{/* ... */};
    const buildDynamicPrompt=e=>{/* ... */};

    /**
     * Converts UTC dates to CT and filters the results based on the user's choice.
     */
    const processAndFilterData = (rawData, filterType) => {
        const data = JSON.parse(JSON.stringify(rawData)); // Deep copy
        const ctOffsetHours = -5;

        // Helper to format date into YYYY-MM-DD HH:MM:SS CT
        const formatCTDate = (d) => {
            const pad = (n) => n.toString().padStart(2, '0');
            const year = d.getFullYear();
            const month = pad(d.getMonth() + 1);
            const day = pad(d.getDate());
            const hours = pad(d.getHours());
            const minutes = pad(d.getMinutes());
            const seconds = pad(d.getSeconds());
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} CT`;
        };

        // First, convert all dates and store the actual Date object
        data.result.forEach(activity => {
            const utcDate = new Date(activity.createdAt);
            const ctDate = new Date(utcDate.getTime() + ctOffsetHours * 3600 * 1000);
            activity._ctDateObject = ctDate; // Store for filtering
            activity.createdAt = formatCTDate(ctDate); // Replace original string
        });

        if (filterType === 'all') {
            return data; // Return all converted data
        }

        // Define date boundaries in CT
        const nowInCT = new Date(new Date().getTime() + ctOffsetHours * 3600 * 1000);
        const todayStart = new Date(nowInCT.getFullYear(), nowInCT.getMonth(), nowInCT.getDate());
        
        let startDate, endDate;

        if (filterType === 'today') {
            startDate = todayStart;
            endDate = new Date(todayStart.getTime() + 86400000);
        } else if (filterType === 'yesterday') {
            startDate = new Date(todayStart.getTime() - 86400000);
            endDate = todayStart;
        } else if (filterType === 'week') {
            const dayOfWeek = todayStart.getDay(); // Sunday = 0, Saturday = 6
            startDate = new Date(todayStart.getTime() - dayOfWeek * 86400000);
            endDate = new Date(startDate.getTime() + 7 * 86400000);
        }

        data.result = data.result.filter(act => {
            return act._ctDateObject >= startDate && act._ctDateObject < endDate;
        });

        return data;
    };

    const runSummaryProcess = async (conversationId, activityId, dateFilterType, selectedSections) => {
        const apiKey = localStorage.getItem(API_KEY_STORAGE_NAME);
        if (!apiKey) return showToast("API Key not set. Please use settings (gear icon).", "error");
        
        showToast("Starting summary process...", "success");
        try {
            const authToken = await getAuthToken();
            
            // Fetch a large block of history to ensure we have enough to filter
            const openPhoneApiUrl = `https://communication.openphoneapi.com/v2/activity?id=${conversationId}&last=200&before=${activityId}`;
            const apiResponse = await fetch(openPhoneApiUrl, { headers: { 'Authorization': authToken }});
            if (!apiResponse.ok) throw new Error(`OpenPhone API request failed: ${apiResponse.status}`);
            const rawData = await apiResponse.json();
            
            // Process the data: convert times to CT and apply the date filter
            const processedData = processAndFilterData(rawData, dateFilterType);
            
            if (processedData.result.length === 0) {
                return showToast(`No activities found for filter: ${dateFilterType}.`, 'error');
            }

            const dynamicPrompt = buildDynamicPrompt(selectedSections);
            const imageParts = [];
            const textPart = { text: dynamicPrompt + JSON.stringify(processedData, null, 2) };
            
            const imageActivities = processedData.result.filter(activity => activity.media?.some(m => m.type.startsWith('image/')));
            if (imageActivities.length > 0) { /* ... (Image fetching logic unchanged) ... */ }

            const initialUserPayload = { role: 'user', parts: [textPart, ...imageParts] };
            const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
            const geminiPayload = { contents: [initialUserPayload] };
            
            showToast("Sending data to Gemini...");
            const geminiFetchResponse = await fetch(geminiApiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(geminiPayload) });
            if (!geminiFetchResponse.ok) throw new Error(`Gemini API request failed: ${await geminiFetchResponse.text()}`);
            const geminiResponse = await geminiFetchResponse.json();
            const geminiResponseText = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!geminiResponseText) throw new Error("Gemini response was empty or in an unexpected format.");
            
            const finalFilename = generateUsefulFilename(conversationId);
            const chatHistory = [initialUserPayload, { role: 'model', parts: [{ text: geminiResponseText }] }];
            showChatModal(chatHistory, finalFilename);
        } catch (error) {
            console.error("❌ An error occurred:", error);
            showToast(error.message, 'error');
        }
    };
    
    // --- UI INJECTION & OBSERVER LOGIC ---
    const initMasterObserver = () => {
        let settingsButtonAdded = false;
        const masterObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== 1) continue;
                    if (!settingsButtonAdded) {
                        const quickActionsBar = node.id === 'message-quick-actions' ? node : node.querySelector('#message-quick-actions');
                        if (quickActionsBar) {
                            addSettingsButton(quickActionsBar);
                            settingsButtonAdded = true;
                            // We can disconnect once the static part is done, the click listener is global
                            masterObserver.disconnect();
                        }
                    }
                }
            }
        });

        // Use a single, global click listener for efficiency and reliability
        document.body.addEventListener('click', (event) => {
            const timestampLink = event.target.closest('a[href*="/c/CN"]');
            if (timestampLink && timestampLink.classList.contains('_64dp6m13')) { // Make selector more specific
                event.preventDefault();
                event.stopPropagation();
                
                const href = timestampLink.getAttribute('href');
                const convoIdMatch = href.match(/c\/(CN[a-zA-Z0-9]+)/);
                const activityIdMatch = href.match(/at=(AC[a-zA-Z0-9]+)/);

                if (convoIdMatch && activityIdMatch) {
                    showExecutionOptionsModal(convoIdMatch[1], activityIdMatch[1]);
                } else {
                    showToast("Could not parse IDs from timestamp link.", "error");
                }
            }
        }, true); // Use capture phase

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
    
    injectStyles(); // Simplified minified versions of these functions
    initMasterObserver();
})();