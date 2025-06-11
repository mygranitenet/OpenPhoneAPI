// ==Bookmarklet Script==
// @name         OpenPhone Gemini Summarizer (Quick Action Button)
// @description  Adds a button to the message quick actions bar to summarize conversations with Gemini.
// @author       ilakskills
// @version      8.0
// ==/Bookmarklet Script==

(() => {
    // --- START OF CONFIGURATION ---
    //const GEMINI_API_KEY = "";
    const GEMINI_PROMPT = `Please analyze the following conversation activity from OpenPhone, which is provided in JSON format. Provide a concise summary of the conversation. Focus on the main topic, any action items, and the overall sentiment.\n\nJSON DATA:\n\n`;
    // --- END OF CONFIGURATION ---

    // --- SVG Icons for the button ---
    const geminiIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path fill="currentColor" d="M10 2.5a.75.75 0 0 1 .75.75V4a.75.75 0 0 1-1.5 0V3.25a.75.75 0 0 1 .75-.75zM10 16a.75.75 0 0 1 .75.75v1.25a.75.75 0 0 1-1.5 0V16.75a.75.75 0 0 1 .75-.75zM5.56 4.81a.75.75 0 0 1 1.06 0l.88.88a.75.75 0 0 1-1.06 1.06l-.88-.88a.75.75 0 0 1 0-1.06zM12.5 12.5a.75.75 0 0 1 1.06 0l.88.88a.75.75 0 0 1-1.06 1.06l-.88-.88a.75.75 0 0 1 0-1.06zM2 9.25a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 2 9.25zm14.25.75a.75.75 0 0 0 1.5 0v-1.5a.75.75 0 0 0-1.5 0v1.5zM5.56 14.13a.75.75 0 0 1 0-1.06l.88-.88a.75.75 0 0 1 1.06 1.06l-.88.88a.75.75 0 0 1-1.06 0zM12.5 6.56a.75.75 0 0 1 0-1.06l.88-.88a.75.75 0 1 1 1.06 1.06l-.88.88a.75.75 0 0 1-1.06 0z"></path></svg>`;
    const loadingSpinnerSVG = `<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><style>.spinner_Gu6E{animation:spinner_gY4H 2s linear infinite}.spinner_gYuN{animation-delay:-.5s}.spinner_4j7o{animation-delay:-1s}.spinner_M323{animation-delay:-1.5s}@keyframes spinner_gY4H{0%,100%{r:1.5px}50%{r:3px}}</style><circle class="spinner_Gu6E" cx="12" cy="3" r="1.5" fill="currentColor"/><circle class="spinner_Gu6E spinner_gYuN" cx="12" cy="21" r="1.5" fill="currentColor"/><circle class="spinner_Gu6E spinner_4j7o" cx="3" cy="12" r="1.5" fill="currentColor"/><circle class="spinner_Gu6E spinner_M323" cx="21" cy="12" r="1.5" fill="currentColor"/></svg>`;
    
    // An ID to make sure we only add the button once.
    const BUTTON_ID = 'gemini-quick-action-button';
    if (document.getElementById(BUTTON_ID)) {
        console.log("✅ Gemini Summarizer button already exists.");
        return;
    }

    /**
     * This is the main function that runs when the button is clicked.
     */
    const runSummaryProcess = async (buttonElement) => {
        // Provide visual feedback that the process has started
        buttonElement.innerHTML = loadingSpinnerSVG;
        buttonElement.disabled = true;
        buttonElement.title = "Processing...";

        const getAuthToken = () => {
            return new Promise((resolve, reject) => {
                let capturedAuthToken = null;
                const originalFetch = window.fetch;
                const originalXhrSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
                window.fetch=function(...args){const headers=args[1]?.headers;if(headers&&(headers.Authorization||headers.authorization)){capturedAuthToken=headers.Authorization||headers.authorization}return originalFetch.apply(this,args)};XMLHttpRequest.prototype.setRequestHeader=function(header,value){if(header.toLowerCase()==='authorization'){capturedAuthToken=value}return originalXhrSetRequestHeader.apply(this,arguments)};const cleanup=()=>{window.fetch=originalFetch;XMLHttpRequest.prototype.setRequestHeader=originalXhrSetRequestHeader};let attempts=0;const interval=setInterval(()=>{if(capturedAuthToken){clearInterval(interval);cleanup();resolve(capturedAuthToken)}else if(attempts++>150){clearInterval(interval);cleanup();reject(new Error("Auth token timeout."))}},100);
            });
        };

        const generateUsefulFilename = (conversationId) => {
            const now = new Date();
            const pad = (num) => num.toString().padStart(2, '0');
            const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
            const nameElement = document.querySelector('[data-test-id="conversation-header-title"]');
            let contactInfo = nameElement && nameElement.textContent.trim() ? nameElement.textContent.trim().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-') : conversationId;
            return `${timestamp}_${contactInfo}_OpenPhone_Summary.txt`;
        };

        try {
            console.log("🚀 Running Gemini Summary Process...");
            const authToken = await getAuthToken();
            const currentUrl = window.location.href;
            const conversationId = currentUrl.split('/').pop() || currentUrl.split('/').slice(-2)[0];
            if (!conversationId || !conversationId.startsWith('CN')) throw new Error(`Invalid Conversation ID: "${conversationId}"`);
            
            const finalFilename = generateUsefulFilename(conversationId);
            const openPhoneApiUrl = `https://communication.openphoneapi.com/v2/activity?id=${conversationId}&last=51`;
            const apiResponse = await fetch(openPhoneApiUrl, { headers: { 'Authorization': authToken } });
            if (!apiResponse.ok) throw new Error(`OpenPhone API request failed: ${apiResponse.status}`);
            const openPhoneData = await apiResponse.json();

            const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
            const geminiPayload = { contents: [{ parts: [{ text: GEMINI_PROMPT + JSON.stringify(openPhoneData, null, 2) }] }] };
            const geminiFetchResponse = await fetch(geminiApiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(geminiPayload) });
            if (!geminiFetchResponse.ok) throw new Error(`Gemini API request failed: ${await geminiFetchResponse.text()}`);
            const geminiResponse = await geminiFetchResponse.json();
            
            const geminiResponseText = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!geminiResponseText) throw new Error("Gemini response was empty or in an unexpected format.");
            
            const blob = new Blob([geminiResponseText], { type: 'text/plain;charset=utf-8' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = finalFilename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

        } catch (error) {
            console.error("❌ An error occurred:", error);
            alert(`Script failed: ${error.message}`);
        } finally {
            // Restore button to its original state
            buttonElement.innerHTML = geminiIconSVG;
            buttonElement.disabled = false;
            buttonElement.title = "Get Gemini Summary";
            console.log("🎉 Script finished. Button is ready for next use.");
        }
    };
    
    /**
     * This function creates and injects the quick action button.
     */
    const createAndInjectQuickActionButton = () => {
        const targetContainer = document.getElementById('message-quick-actions');
        if (!targetContainer) {
            console.error("❌ Could not find the quick actions container. Is a conversation open?");
            return;
        }

        const templateButton = targetContainer.querySelector('button');
        if (!templateButton) {
            console.error("❌ Could not find a template button to clone.");
            return;
        }

        // Clone the existing button to perfectly match the style
        const newButton = templateButton.cloneNode(true);

        // Customize our new button
        newButton.id = BUTTON_ID;
        newButton.innerHTML = geminiIconSVG;
        newButton.title = "Get Gemini Summary";
        
        // Remove the original accessibility label if it exists
        const ariaLabelledby = newButton.getAttribute('aria-labelledby');
        if (ariaLabelledby) {
            newButton.removeAttribute('aria-labelledby');
            const oldLabel = document.getElementById(ariaLabelledby);
            if (oldLabel && oldLabel.parentElement) {
                // The label is inside a visually hidden div, we can remove that parent
                oldLabel.parentElement.remove();
            }
        }
        
        // Add the click listener to our main function
        newButton.addEventListener('click', () => runSummaryProcess(newButton));

        // Add the new button to the start of the toolbar
        targetContainer.prepend(newButton);
        console.log("✅ Gemini Summarizer quick action button successfully added.");
    };
    
    // Run the injection logic
    createAndInjectQuickActionButton();
})();
