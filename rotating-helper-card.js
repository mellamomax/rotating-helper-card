class RotatingHelperCard extends HTMLElement {
    config;
    content;
    isDragging = false;

    setConfig(config) {
        console.log("Config received by RotatingHelperCard:", config);
        this.config = config;
        // Set the step size from the config or default to 30
        this.stepSize = parseInt(this.config.stepSize) || 30;
        this.maxValue = parseFloat(config.maxValue) || 300;

        if (this._entitySelect) {
            this._entitySelect.value = config.entity;
        }
        
        // Populate the automation dropdown with the value from the configuration
        if (this.config.automation && this.automationDropdownInput) {
            // Find the friendly name of the automation entity
            const friendlyName = this._hass.states[this.config.automation]?.attributes?.friendly_name || this.config.automation;
            this.automationDropdownInput.value = friendlyName;
        }
            
        // Update the 'secondaryValue' text in the card based on the configuration
        const secondaryValueElement = this.querySelector('#format-text');
        if (secondaryValueElement) {
            secondaryValueElement.textContent = config.secondaryValue || 'sec'; // Default to 'sec'
        }
    }
        
    get styles() {
        return `
            #circle-background {
                /* Styles for the background circle */
            }
            #circle-track {
                /* Styles for the track circle */
            }
            #progress-ring {
                /* Styles for the progress ring */
            }
            .value {
                font-size: 14px;
                font-weight: 800;
            }
            #secondary-text {
                font-weight: 600;
                font-size: 2px;
            }
            #format-text {
                font-size: 2px;
                font-weight: 600;
            }
        `;
    }

    set hass(hass) {
        this._hass = hass;
        const entityId = this.config.entity;
        const state = hass.states[entityId];
        const stateStr = state ? state.state : 'unavailable';
    
    
        // Update the friendly name text
        const friendlyName = state ? (state.attributes.friendly_name || entityId) : 'No entity';
        const helperTextElement = this.querySelector('#secondary-text');
        if (helperTextElement) {
            helperTextElement.textContent = friendlyName;
        }

        // Inside set hass method of RotatingHelperCard class
        const automationEntity = hass.states[this.config.automation];
        const ringColor = this.config.ringColor || '#5d6263';
        const trackColor = this.config.trackColor || '#b1b4b5';
        const valueColor = this.config.valueColor || 'black';
        const labelColor = this.config.labelColor || 'black';
        const entityColor = this.config.entityColor || 'black';

        
        
        if (automationEntity) {
            const isAutomationOn = automationEntity.state === 'on';
            const onColor = this.config.onColor || '#DBE4D7'; // Default on color
            const offColor = this.config.offColor || 'rgba(233, 233, 233, 0.29)'; // Default off color
            this.setCircleColor(isAutomationOn ? onColor : offColor);
            
            // Call setRingColor with offColor if the automation is off, else use ringColor
            this.setRingColor(isAutomationOn ? ringColor : offColor);
            this.setValueColor(isAutomationOn ? valueColor : 'grey');
            this.setLabelColor(isAutomationOn ? labelColor : 'grey');
            this.setEntityColor(isAutomationOn ? entityColor : 'grey');
        } else {
            // If there is no automation entity, use default ringColor
            this.setRingColor(ringColor);
            this.setValueColor(valueColor);
            this.setLabelColor(labelColor);            
            this.setEntityColor(entityColor);
        }
        
        // Set the track color
        this.setTrackColor(trackColor);
     
        if (!this.content) {
            this.innerHTML = `
                <style>${this.styles}</style>
                <ha-card>
                    <div class="card-content">
                        <div class="circle-card" id="circle-card">
                            <svg viewbox="0 0 50 50">
                            
                                <!-- Solid grey background circle -->
                                <circle cx="25" cy="25" r="24" fill="grey" id="circle-background" ></circle>
                                
                                <!-- Grey background circle with transparent portion -->
                                <path d="M25 5 A 20 20 1 1 0 45 25" fill="none" stroke="#b1b4b5" stroke-width="5" stroke-linecap="round" transform="rotate(135 25 25)" id="circle-track" ></path>
  
                                <!-- Grey progress ring with rounded edges -->
                                <circle cx="25" cy="25" r="20" fill="none" stroke="#5d6263" stroke-width="5" stroke-dasharray="126" stroke-dashoffset="126" id="progress-ring" stroke-linecap="round" transform="rotate(135 25 25)"></circle>
        
                                
                                <!-- Text element for value -->
                                <text x="50%" y="50%" class="value" dy=".3em" text-anchor="middle" id="value-text" fill="black">0</text>
                                
                                <!-- Text element for helper name -->
                                <text x="50%" y="80%" class="helper" dy="0.3em" id="secondary-text" text-anchor="middle" fill="black">select helper</text>

                                <!-- New text element -->
                                <text x="50%" y="65%" class="static-text" id="format-text" text-anchor="middle" fill="black">sec</text>
                                
                                
                                <!-- Add a rectangle to act as a button -->
                                <circle id="my-button" cx="25" cy="25" r="15" fill="transparent" style="cursor: pointer;" />
                                <!-- Add text for the button -->
                                <text id="my-button-text" x="15" y="15" text-anchor="middle" fill="black" style="cursor: pointer;"></text>
                                
                                
                                
                            </svg>
                        </div>
                    </div>
                </ha-card>
            `;
            this.content = this.querySelector('div');
            this.addEventListeners();
            

            // Bind the clickHandler to this instance
            this.clickHandler = this.clickHandler.bind(this);
        
            // Add event listener for the button
            const button = this.querySelector('#my-button');
            const buttonText = this.querySelector('#my-button-text');
            button.addEventListener('click', this.clickHandler);
            buttonText.addEventListener('click', this.clickHandler); // Text also needs the event listener

        }
    
        // Update the value displayed in the SVG text element
        this.updateValue(stateStr);
    }

    addEventListeners() {
        const circleTrack = this.querySelector('#circle-track');
        const progressRing = this.querySelector('#progress-ring');
    
        // Function to handle start interaction for both elements
        const startInteractionHandler = (e) => this.startInteraction(e);
    
        // Attach mouse and touch event listeners to the circle track and progress ring
        [circleTrack, progressRing].forEach(element => {
            element.addEventListener('mousedown', startInteractionHandler);
            element.addEventListener('touchstart', startInteractionHandler);
        });
    
        // Document-level event listeners for mousemove and touchmove
        document.addEventListener('mousemove', this.onInteraction.bind(this));
        document.addEventListener('touchmove', this.onInteraction.bind(this));
    
        // Document-level event listeners for mouseup and touchend
        document.addEventListener('mouseup', this.endInteraction.bind(this));
        document.addEventListener('touchend', this.endInteraction.bind(this));
    
    
        // Check if _entitySelect exists before adding the event listener
        if (this._entitySelect) {
            // Add an event listener to handle entity selection
            this._entitySelect.addEventListener('change', (event) => {
                this.config = {
                    ...this.config,
                    entity: event.target.value
                };
                fireEvent(this, 'config-changed', { config: this.config });
            });
        }
        
        
        // Check if automation value exists before adding the event listener
        if (this.automationDropdownInput) {
            // Add an event listener to handle entity selection
            this.automationDropdownInput.addEventListener('change', (event) => {
                this.config = {
                    ...this.config,
                    entity: event.target.value
                };
                fireEvent(this, 'config-changed', { config: this.config });
            });
        }
        
        
        
    }

    changeValue(increment) {
        if (!this._hass) {
            return;
        }

        const entityId = this.config.entity;
        const state = this._hass.states[entityId];
        if (!state) {
            return;
        }

        const currentValue = Number(state.state);
        const stepSize = parseInt(this.config.stepSize) || 30;

        let newValue = increment ? currentValue + stepSize : currentValue - stepSize;

        // Ensure newValue stays within the allowed range
        newValue = Math.max(30, Math.min(newValue, this.maxValue * this.stepSize)); // Use this.maxValue instead of a hard-coded value


        // Call Home Assistant service to update the value
        this._hass.callService('input_number', 'set_value', {
            entity_id: entityId,
            value: newValue
        });
    }

    changeValueDirectly(newValue) {
        const entityId = this.config.entity;
    
        // Ensure newValue is within the allowed range
        newValue = Math.max(30, Math.min(newValue, this.maxValue * this.stepSize));
    
        // Call Home Assistant service to update the value
        this._hass.callService('input_number', 'set_value', {
            entity_id: entityId,
            value: newValue
        });
    }

    startInteraction(e) {
        // For touch events, prevent default behavior and get touch points
        if (e.touches) {
            e.preventDefault();
            e = e.touches[0];
        }
        this.isDragging = true;
        this.updateValueOnInteraction(e);
    }

    onInteraction(e) {
        if (this.isDragging) {
            if (e.touches) {
                e.preventDefault();
                e = e.touches[0];
            }
            this.updateValueOnInteraction(e);
        }
    }

    endInteraction(e) {
        if (e.touches && e.touches.length > 0) {
            e = e.touches[0];
        }
        this.isDragging = false;
    }

    updateValueOnInteraction(e) {
        const circleRect = this.querySelector('#circle-card').getBoundingClientRect();
        const circleCenterX = circleRect.left + circleRect.width / 2;
        const circleCenterY = circleRect.top + circleRect.height / 2;
    
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        const deltaX = mouseX - circleCenterX;
        const deltaY = mouseY - circleCenterY;
    
        let angle = Math.atan2(deltaY, deltaX);
    
        // Adjust for the SVG rotation of 135 degrees
        angle -= (3 * Math.PI / 4);
        if (angle < 0) {
            angle += 2 * Math.PI;
        }
    
        // Normalize the angle to the effective range (5/6 of the full circle)
        const effectiveRange =2.25 * Math.PI - (3 * Math.PI / 4);
        angle = Math.min(angle, effectiveRange);
    
        // Map the angle to the value range (30-maxValue)
        let value = (angle / effectiveRange) * ((this.maxValue * this.stepSize) - 30) + 30; // maxValue replaces the hard-coded 270
        value = Math.max(30, Math.min(value, this.maxValue * this.stepSize));
    
        // Snap value to nearest multiple of stepSize
        value = Math.round(value / this.stepSize) * this.stepSize;
        this.changeValueDirectly(value);
        
    }

    updateValue(value) {
        const valueText = this.querySelector('#value-text');
        const progressRing = this.querySelector('#progress-ring');
    
        // Ensure value is within range
        value = Math.max(30, Math.min(Math.floor(value), this.maxValue * this.stepSize));
    
        valueText.textContent = value;
        // Fixed proportion of the full circle (e.g., 3/4)
        const fixedProportion = 4.5 / 6;
    
        // Total length of the circle
        const totalLength = 126; // Total length of the circle's stroke
    
        // Adjust the offset calculation
        var offset = totalLength * (1 - ((value - 30) / ((this.maxValue * this.stepSize) - 30) * fixedProportion));
        progressRing.style.strokeDashoffset = offset;
    }

    clickHandler() {
        console.log('Button was pressed!');
    
        // Call the Home Assistant service to toggle the automation
        if (this._hass && this.config.automation) {
            this._hass.callService('automation', 'toggle', {
                entity_id: this.config.automation
            }).then(() => {
                console.log('Service call successful');
            }).catch((error) => {
                console.error('Service call failed', error);
            });
        } else {
            console.error('No automation set in config');
        }
    }

    setCircleColor(color) {
        const circleBackground = this.querySelector('#circle-background');
        if (circleBackground) {
            circleBackground.setAttribute('fill', color);
        }
    }
    
    setRingColor(color) {
        const progressRing = this.querySelector('#progress-ring');
        if (progressRing) {
            progressRing.setAttribute('stroke', color);
        }
    }

    setTrackColor(color) {
        const circleTrack = this.querySelector('#circle-track');
        if (circleTrack) {
            circleTrack.setAttribute('stroke', color);
        }
    }
    
    setValueColor(color) {
        const valueText = this.querySelector('#value-text');
        if (valueText) {
            valueText.setAttribute('fill', color);
        }
    }
    
    setLabelColor(color) {
        const valueText = this.querySelector('#format-text');
        if (valueText) {
            valueText.setAttribute('fill', color);
        }
    }

    setEntityColor(color) {
        const valueText = this.querySelector('#secondary-text');
        if (valueText) {
            valueText.setAttribute('fill', color);
        }
    }

    // Inside RotatingHelperCard class
    getCardSize() {
        return 3; // Adjust size as needed
    }
    
    static getConfigElement() {
        return document.createElement('rotating-helper-card-editor');
    }
    
    // Modify or add this method
    static getStubConfig() {
        return {
            // Default configuration for your card
            entity: '', // You can set a default entity or leave it empty
            stepSize: '', // Default step size
            maxValue: '', // Default max value
            secondaryValue: "sec",
            onColor: '',
            offColor: '',
            ringColor: '',
            trackColor: '',
            automation: '', // Add a default automation property if needed
        };
    }
}

customElements.define('rotating-helper-card', RotatingHelperCard);



class RotatingHelperCardEditor extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.handleMaxValueInput = this.handleMaxValueInput.bind(this);
        this.handleSecondaryValueInput = this.handleSecondaryValueInput.bind(this);
        this.handleStepSizeInput = this.handleStepSizeInput.bind(this);
        this.handleEntityChange = this.handleEntityChange.bind(this);
        this.populateEntities = this.populateEntities.bind(this);
        this.setConfig = this.setConfig.bind(this);
    }

    connectedCallback() {
        if (!this.shadowRoot.innerHTML) {
           this.shadowRoot.innerHTML = `
                <style>
                    /* Styles for step container */
                    .step-container {
                        width: 42%;
                        padding: 8px;
                        height: 40px;
                        border-bottom: 1px solid #818181;
                        background-color: #f5f5f5;
                        cursor: text;
                        z-index: 1;
                        margin-bottom: 24px;
                        position: relative;
                        line-height: 1.5;
                        display: flex;
                        left: 15px;
                        align-items: center;
                        justify-content: space-between;
                    }
                    
                    .step-container:hover {
                        background-color: #ececec; /* A darker shade when hovering */
                    }
                    
                    .step-container label {
                        /* Styles for the helper name */
                        display: block;
                        color: var(--secondary-text-color);
                        font-size: 11px; /* Match the size with your design */
                        top: 12px;
                        z-index: 1;
                        position: absolute;
                        margin-left: 10px;
                    }
                    
                    .step-container:focus-within {
                        border-bottom: 2px solid #3f3f3f; /* Border for the entire container */
                    }
                    
                    .step-container input[type="text"] {
                        width: 100%;
                        padding: 10px;
                        border: 0px solid #818181;
                        border-radius: 4px;
                        background: none;
                        color: black;
                        margin-top: 18px; /* This will move the input box down by 5px */
                        font-family: var(--mdc-typography-subtitle1-font-family, var(--mdc-typography-font-family, Roboto, sans-serif));
                        font-size: var(--mdc-typography-subtitle1-font-size, 1rem);
                    }
                    
                    .step-container input[type="text"]:focus + label,
                    .step-container input[type="text"]:not(:placeholder-shown) + label {
                        top: -10px;
                        left: 10px;
                        font-size: 12px;
                        color: var(--primary-text-color);
                    }
    
                    .step-container input[type="text"]:focus {
                        border: none; /* This line will remove the border */
                        outline: none; /* This line removes the default browser outline */
                    }
                    
                    .max-value-container {
                        width: 42%;
                        padding: 8px;
                        height: 40px;
                        border-bottom: 1px solid #818181;
                        background-color: #f5f5f5;
                        cursor: text;
                        z-index: 1;
                        position: relative;
                        top: -81px;
                        line-height: 1.5;
                        display: flex;
                        left: 251px;
                        align-items: center;
                        justify-content: space-between;
                    }
                    
                    .max-value-container:hover {
                        background-color: #ececec; /* A darker shade when hovering */
                    }
                    
                    .max-value-container label {
                        /* Styles similar to step-container label */
                        display: block;
                        color: var(--secondary-text-color);
                        font-size: 11px;
                        top: 12px;
                        z-index: 1;
                        position: absolute;
                        margin-left: 10px;
                    }
                    
                    .max-value-container:focus-within {
                        border-bottom: 2px solid #3f3f3f; /* Border for the entire container */
                    }
                    
                    .max-value-container input[type="text"] {
                        /* Styles similar to step-container input */
                        width: 100%;
                        padding: 10px;
                        border: 0px solid #818181;
                        border-radius: 4px;
                        background: none;
                        color: black;
                        margin-top: 18px; /* This will move the input box down by 5px */
                        font-family: var(--mdc-typography-subtitle1-font-family, var(--mdc-typography-font-family, Roboto, sans-serif));
                        font-size: var(--mdc-typography-subtitle1-font-size, 1rem);
                    }
                
                    .max-value-container input[type="text"]:focus {
                        border: none; /* This line will remove the border */
                        outline: none; /* This line removes the default browser outline */
                    }

                    .secondary-value-container {
                        width: 93%;
                        padding: 8px;
                        height: 40px;
                        border-bottom: 1px solid #818181;
                        background-color: #f5f5f5;
                        cursor: text;
                        z-index: 1;
                        position: relative;
                        margin-bottom: 24px;
                        line-height: 1.5;
                        display: flex;
                        left: 15px;
                        align-items: center;
                        justify-content: space-between;
                    }
                    .secondary-value-container:hover {
                        background-color: #ececec; /* A darker shade when hovering */
                    }
                    
                    .secondary-value-container:focus-within {
                        border-bottom: 2px solid #3f3f3f; /* Border for the entire container */
                    }
                    
                    .secondary-value-container label {
                        /* Styles similar to step-container label */
                        display: block;
                        color: var(--secondary-text-color);
                        font-size: 11px;
                        top: 12px;
                        z-index: 1;
                        position: absolute;
                        margin-left: 10px;
                    }
                    .secondary-value-container input[type="text"] {
                        /* Styles similar to step-container input */
                        width: 100%;
                        padding: 10px;
                        border: none; /* Remove all borders by default */
                        border-bottom: 1px solid transparent; /* Optional: Add a transparent bottom border if needed */
                        border-radius: 4px;
                        background: none;
                        color: var(--mdc-text-field-ink-color,rgba(0,0,0,.87));
                        margin-top: 18px; /* This will move the input box down by 5px */
                        font-family: var(--mdc-typography-subtitle1-font-family, var(--mdc-typography-font-family, Roboto, sans-serif));
                        font-size: var(--mdc-typography-subtitle1-font-size, 1rem);
                    }
                    .secondary-value-container input[type="text"]:focus {
                        outline: none; /* Removes the default focus outline */
                        border: none;
                    }


                    .dropdown {
                        position: relative;
                        border: none;
                    }
                    .dropdown label {
                        /* Styles similar to step-container label */
                        display: block;
                        color: var(--secondary-text-color);
                        font-size: 11px;
                        top: 0px;
                        z-index: 3;
                        position: absolute;
                        margin-left: 10px;
                    }
                    .dropdown-input-wrapper:hover {
                        background-color: #ececec; /* A darker shade when hovering */
                    }
                    .dropdown-input-wrapper:focus-within {
                        outline: none !important; /* Removes the default focus outline */
                        border-left: none !important;
                        border-right: none !important;
                        border-top: none !important;
                        border-bottom: 2px solid #3f3f3f;
                        /* Or use border-color: transparent; if you want to keep the border size but make it invisible */
                    }
                    .dropdown-list {
                        position: absolute;
                        z-index: 3;
                        list-style: none;
                        margin: 0;
                        padding: 0px;
                        background: white;
                        border: 0px solid #818181;
                        border-radius: 0px;
                        box-sizing: border-box;
                        left: 15px;
                        top: 58px;
                        box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2); /* Add box shadow here */
                        width: 96%;
                        height: auto;
                        display: none; /* Hidden by default */
                    }
                    .dropdown-list li {
                        padding: 8px;
                        height: 60px;
                        cursor: pointer;
                    }
                    .dropdown-list li:hover {
                        background-color: #f0f0f0;
                    }
                    .dropdown-list li span {
                        margin-left: 60px;
                        margin-top: 5px;
                    }
                    .dropdown-list li span:nth-child(2) {
                        color: #212121; /* Sets the text color of the full entity name to grey */
                        font-size: smaller;
                        position: absolute;
                    }
                    .dropdown-list li ha-icon {
                        position: relative;
                        left: 15px; /* Move the icon 10px to the left */
                        top: 18px; /* Move the icon 10px down */
                        color: #727272;
                        margin-right: 8px; /* Keep your existing space to the right of the icon */
                    }
                    .dropdown-input-wrapper {
                        width: 93%;
                        padding: 8px;
                        height: 40px;
                        border-bottom: 1px solid #818181;
                        background-color: #f5f5f5;
                        cursor: text;
                        z-index: 1;
                        position: relative;
                        margin-bottom: 24px;
                        line-height: 40px;
                        display: flex;
                        left: 15px;
                        align-items: center;
                        justify-content: space-between;
                    }
                    .dropdown-input-wrapper #dropdown-input {
                        width: 100%; /* Full width of the wrapper */
                        border: none; /* No border */
                        outline: none;
                        background-color: transparent; /* Transparent background */
                        color: var(--mdc-text-field-ink-color,rgba(0,0,0,.87)); /* Text color */
                        font-family: var(--mdc-typography-subtitle1-font-family, Roboto, sans-serif);
                        font-size: 1rem; /* Text size */
                        line-height: 40px; /* Align with the height of the wrapper */
                        text-indent: 7px;
                        top: 15px;
                        position: absolute;
                        /* No changes to padding or margin */
                    }


                    .automation-dropdown label {
                        /* Styles similar to step-container label */
                        display: block;
                        color: var(--secondary-text-color);
                        font-size: 11px;
                        cursor: pointer;
                        z-index: 2;
                        position: absolute;
                        margin-left: 10px;
                    }
                    .automation-dropdown-input-wrapper:hover {
                        background-color: #ececec; /* A darker shade when hovering */
                    }
                    .automation-dropdown-input-wrapper:focus-within {
                        outline: none; /* Removes the default focus outline */
                        border-left: none;
                        border-right: none;
                        border-top: none;
                        border-bottom: 2px solid #3f3f3f;
                        /* Or use border-color: transparent; if you want to keep the border size but make it invisible */
                    }
                    .automation-dropdown-list {
                        position: absolute;
                        z-index: 2;
                        list-style: none;
                        margin: 0;
                        padding: 0px;
                        background: white;
                        border: 0px solid #818181;
                        border-radius: 0px;
                        box-sizing: border-box;
                        left: 15px;
                        top: -159px;
                        box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2); /* Add box shadow here */
                        width: 96%;
                        height: auto;
                        display: none; /* Hidden by default */
                        max-height: calc(60px * 6); /* 60px is the height of each item, adjust if your item height is different */
                        overflow-y: auto; /* enables vertical scrolling */
                    }
                    .automation-dropdown-list li {
                        padding: 8px;
                        height: 60px;
                        cursor: pointer;
                    }
                    .automation-dropdown-list li:hover {
                        background-color: #f0f0f0;
                    }
                    .automation-dropdown-list li span {
                        margin-left: 60px !important;
                        margin-top: 5px !important;
                    }
                    .automation-dropdown-list li span:nth-child(2) {
                        color: #212121;
                        font-size: smaller;
                        position: absolute;
                    }
                    .automation-dropdown-list li ha-icon {
                        position: relative;
                        left: 15px; /* Move the icon 10px to the left */
                        top: 18px; /* Move the icon 10px down */
                        color: #727272;
                        margin-right: 8px; /* Keep your existing space to the right of the icon */
                    }
                    .automation-dropdown-input-wrapper {
                        width: 93%;
                        padding: 8px;
                        height: 40px;
                        border-bottom: 1px solid #818181;
                        background-color: #f5f5f5;
                        cursor: pointer;
                        z-index: 1;
                        position: relative;
                        margin-bottom: 24px;
                        line-height: 40px;
                        display: flex;
                        left: 15px;
                        bottom: 217px;
                        align-items: center;
                        justify-content: space-between;
                    }
                    .automation-dropdown-input-wrapper #automation-input {
                        width: 100%; /* Full width of the wrapper */
                        border: none; /* No border */
                        outline: none;
                        background-color: transparent; /* Transparent background */
                        color: var(--mdc-text-field-ink-color,rgba(0,0,0,.87)); /* Text color */
                        font-family: var(--mdc-typography-subtitle1-font-family, Roboto, sans-serif);
                        font-size: 1rem; /* Text size */
                        line-height: 40px; /* Align with the height of the wrapper */
                        text-indent: 7px;
                        top: 15px;
                        cursor: pointer;
                        position: absolute;
                        /* No changes to padding or margin */
                    }

                    
                    
                    .on-color-container {
                        width: 42%;
                        padding: 8px;
                        height: 40px;
                        border-bottom: 1px solid #818181;
                        background-color: #f5f5f5;
                        cursor: text;
                        z-index: 1;
                        position: relative;
                        margin-bottom: 24px;
                        line-height: 1.5;
                        display: flex;
                        left: 15px;
                        align-items: center;
                        bottom: 56px;
                        justify-content: space-between;
                    }
                    .on-color-container:hover {
                        background-color: #ececec; /* A darker shade when hovering */
                    }
                    
                    .on-color-container:focus-within {
                        border-bottom: 2px solid #3f3f3f; /* Border for the entire container */
                    }
                    
                    .on-color-container label {
                        /* Styles similar to step-container label */
                        display: block;
                        color: var(--secondary-text-color);
                        font-size: 11px;
                        top: 12px;
                        z-index: 1;
                        position: absolute;
                        margin-left: 10px;
                    }
                    .on-color-container input[type="text"] {
                        /* Styles similar to step-container input */
                        width: 100%;
                        padding: 10px;
                        border: none; /* Remove all borders by default */
                        border-bottom: 1px solid transparent; /* Optional: Add a transparent bottom border if needed */
                        border-radius: 4px;
                        background: none;
                        color: var(--mdc-text-field-ink-color,rgba(0,0,0,.87));
                        margin-top: 18px; /* This will move the input box down by 5px */
                        font-family: var(--mdc-typography-subtitle1-font-family, var(--mdc-typography-font-family, Roboto, sans-serif));
                        font-size: var(--mdc-typography-subtitle1-font-size, 1rem);
                    }
                    .on-color-container input[type="text"]:focus {
                        outline: none; /* Removes the default focus outline */
                        border: none;
                    }
                    
                    
                    
                    
                    
                    .off-color-container {
                        width: 42%;
                        padding: 8px;
                        height: 40px;
                        border-bottom: 1px solid #818181;
                        background-color: #f5f5f5;
                        cursor: text;
                        z-index: 1;
                        position: relative;
                        margin-bottom: 24px;
                        bottom: 136px;
                        line-height: 1.5;
                        display: flex;
                        left: 251px;
                        align-items: center;
                        justify-content: space-between;
                    }
                    .off-color-container:hover {
                        background-color: #ececec; /* A darker shade when hovering */
                    }
                    
                    .off-color-container:focus-within {
                        border-bottom: 2px solid #3f3f3f; /* Border for the entire container */
                    }
                    
                    .off-color-container label {
                        /* Styles similar to step-container label */
                        display: block;
                        color: var(--secondary-text-color);
                        font-size: 11px;
                        top: 12px;
                        z-index: 1;
                        position: absolute;
                        margin-left: 10px;
                    }
                    .off-color-container input[type="text"] {
                        /* Styles similar to step-container input */
                        width: 100%;
                        padding: 10px;
                        border: none; /* Remove all borders by default */
                        border-bottom: 1px solid transparent; /* Optional: Add a transparent bottom border if needed */
                        border-radius: 4px;
                        background: none;
                        color: var(--mdc-text-field-ink-color,rgba(0,0,0,.87));
                        margin-top: 18px; /* This will move the input box down by 5px */
                        font-family: var(--mdc-typography-subtitle1-font-family, var(--mdc-typography-font-family, Roboto, sans-serif));
                        font-size: var(--mdc-typography-subtitle1-font-size, 1rem);
                    }
                    .off-color-container input[type="text"]:focus {
                        outline: none; /* Removes the default focus outline */
                        border: none;
                    }
                    
                    
                    
                    
                    .ring-color-container {
                        width: 42%;
                        padding: 8px;
                        height: 40px;
                        border-bottom: 1px solid #818181;
                        background-color: #f5f5f5;
                        cursor: text;
                        z-index: 1;
                        position: relative;
                        margin-bottom: 24px;
                        line-height: 1.5;
                        display: flex;
                        left: 15px;
                        align-items: center;
                        bottom: 136px;
                        justify-content: space-between;
                    }
                    .ring-color-container:hover {
                        background-color: #ececec; /* A darker shade when hovering */
                    }
                    
                    .ring-color-container:focus-within {
                        border-bottom: 2px solid #3f3f3f; /* Border for the entire container */
                    }
                    
                    .ring-color-container label {
                        /* Styles similar to step-container label */
                        display: block;
                        color: var(--secondary-text-color);
                        font-size: 11px;
                        top: 12px;
                        z-index: 1;
                        position: absolute;
                        margin-left: 10px;
                    }
                    .ring-color-container input[type="text"] {
                        /* Styles similar to step-container input */
                        width: 100%;
                        padding: 10px;
                        border: none; /* Remove all borders by default */
                        border-bottom: 1px solid transparent; /* Optional: Add a transparent bottom border if needed */
                        border-radius: 4px;
                        background: none;
                        color: var(--mdc-text-field-ink-color,rgba(0,0,0,.87));
                        margin-top: 18px; /* This will move the input box down by 5px */
                        font-family: var(--mdc-typography-subtitle1-font-family, var(--mdc-typography-font-family, Roboto, sans-serif));
                        font-size: var(--mdc-typography-subtitle1-font-size, 1rem);
                    }
                    .ring-color-container input[type="text"]:focus {
                        outline: none; /* Removes the default focus outline */
                        border: none;
                    }
                    
                    
                    
                    .track-color-container {
                        width: 42%;
                        padding: 8px;
                        height: 40px;
                        border-bottom: 1px solid #818181;
                        background-color: #f5f5f5;
                        cursor: text;
                        z-index: 1;
                        position: relative;
                        margin-bottom: 24px;
                        line-height: 1.5;
                        bottom: 217px;
                        display: flex;
                        left: 251px;
                        align-items: center;
                        justify-content: space-between;
                    }
                    .track-color-container:hover {
                        background-color: #ececec; /* A darker shade when hovering */
                    }
                    
                    .track-color-container:focus-within {
                        border-bottom: 2px solid #3f3f3f; /* Border for the entire container */
                    }
                    
                    .track-color-container label {
                        /* Styles similar to step-container label */
                        display: block;
                        color: var(--secondary-text-color);
                        font-size: 11px;
                        top: 12px;
                        z-index: 1;
                        position: absolute;
                        margin-left: 10px;
                    }
                    .track-color-container input[type="text"] {
                        /* Styles similar to step-container input */
                        width: 100%;
                        padding: 10px;
                        border: none; /* Remove all borders by default */
                        border-bottom: 1px solid transparent; /* Optional: Add a transparent bottom border if needed */
                        border-radius: 4px;
                        background: none;
                        color: var(--mdc-text-field-ink-color,rgba(0,0,0,.87));
                        margin-top: 18px; /* This will move the input box down by 5px */
                        font-family: var(--mdc-typography-subtitle1-font-family, var(--mdc-typography-font-family, Roboto, sans-serif));
                        font-size: var(--mdc-typography-subtitle1-font-size, 1rem);
                    }
                    .track-color-container input[type="text"]:focus {
                        outline: none; /* Removes the default focus outline */
                        border: none;
                    }
                    
                    
                    
                </style>
                <div class="dropdown">
                    <div class="dropdown-input-wrapper">
                        <label for="dropdown-input">Entity*</label>
                        <input type="text" id="dropdown-input" placeholder="Select an option">
                    </div>
                    <ul class="dropdown-list" style="display:none;"></ul>
                </div>
                
                
                
                <div class="secondary-value-container">
                    <label for="secondaryValue">Secondary value</label>
                    <input type="text" id="secondaryValue">
                </div>
                <div class="step-container">
                    <label for="stepSize">Step size</label>
                    <input type="text" id="stepSize">
                </div>
                <div class="max-value-container">
                    <label for="maxValue"># of steps (max-value)</label>
                    <input type="text" id="maxValue">
                </div>
                
                <div class="on-color-container">
                    <label for="onColor">Color when on</label>
                    <input type="text" id="onColor">
                </div>

                <div class="off-color-container">
                    <label for="offColor">Color when off</label>
                    <input type="text" id="offColor">
                </div>

                <div class="ring-color-container">
                    <label for="ringColor">Ring color</label>
                    <input type="text" id="ringColor">
                </div>

                <div class="track-color-container">
                    <label for="trackColor">Track color</label>
                    <input type="text" id="trackColor">
                </div>



                <div class="dropdown automation-dropdown">
                    <div class="automation-dropdown-input-wrapper">
                        <label for="automation-input">Automation toggle (optional)</label>
                        <input type="text" id="automation-input" placeholder="Select an automation" readonly>
                    </div>
                    <ul class="automation-dropdown-list"></ul>
                </div>

            `;

            this.dropdownInput = this.shadowRoot.querySelector('#dropdown-input');
            this.dropdownList = this.shadowRoot.querySelector('.dropdown-list');


            // Assign the automation dropdown elements
            this.automationDropdownInput = this.shadowRoot.querySelector('#automation-input');
            this.automationDropdownList = this.shadowRoot.querySelector('.automation-dropdown-list');

            // Inside connectedCallback method
            this.onColorInputElement = this.shadowRoot.querySelector('#onColor');
            this.onColorInputElement.addEventListener('change', this.handleOnColorChange.bind(this));
            

            // Inside connectedCallback method
            this.offColorInputElement = this.shadowRoot.querySelector('#offColor');
            this.offColorInputElement.addEventListener('change', this.handleOffColorChange.bind(this));
            
            // Inside connectedCallback method
            this.ringColorInputElement = this.shadowRoot.querySelector('#ringColor');
            this.ringColorInputElement.addEventListener('change', this.handleRingColorChange.bind(this));
            
            // Inside connectedCallback method
            this.trackColorInputElement = this.shadowRoot.querySelector('#trackColor');
            this.trackColorInputElement.addEventListener('change', this.handleTrackColorChange.bind(this));
            
            // Add event listener to handle dropdown opening
            this.dropdownInput.addEventListener('click', () => {
                // Toggle the display of the dropdown list
                const isDisplayed = this.dropdownList.style.display === 'block';
                this.dropdownList.style.display = isDisplayed ? 'none' : 'block';
            });

            // Add event listener to handle automation dropdown opening
            this.automationDropdownInput.addEventListener('click', () => {
                // Toggle the display of the automation dropdown list
                const isDisplayed = this.automationDropdownList.style.display === 'block';
                this.automationDropdownList.style.display = isDisplayed ? 'none' : 'block';
            });


           // Initialize elements after setting the inner HTML
            this.inputElement = this.shadowRoot.querySelector('#stepSize');
            this.inputElement.addEventListener('change', this.handleStepSizeInput);

            // Inside connectedCallback after setting the inner HTML
            this.maxValueElement = this.shadowRoot.querySelector('#maxValue');
            this.maxValueElement.addEventListener('change', this.handleMaxValueInput);

            // Inside connectedCallback after setting the inner HTML
            this.secondaryValueElement = this.shadowRoot.querySelector('#secondaryValue');
            this.secondaryValueElement.addEventListener('change', this.handleSecondaryValueInput);

            // Handle outside click to close the dropdowns
            document.addEventListener('click', (event) => {
                if (!this.shadowRoot.contains(event.target)) {
                    this.dropdownList.style.display = 'none'; // Close entity dropdown list
                    this.automationDropdownList.style.display = 'none'; // Close automation dropdown list
                }
            }, true);
        }
    }

    set hass(hass) {
        this._hass = hass;
    }

    setConfig(config) {
        this.config = config;
    
        // Delay populating the dropdown
        setTimeout(() => {
            this.populateEntities();
            this.updateInputValue();
            this.populateAutomations();
            this.maxvalue
        }, 1); // Delay of 1000 milliseconds (1 second)
        
        
        // Find the input field for secondaryValue within the shadow DOM
        const secondaryValueInput = this.shadowRoot.querySelector('#secondaryValue');
        if (secondaryValueInput) {
            // Set the value of the input field to match the config
            secondaryValueInput.value = config.secondaryValue || 'sec';
        }
    }

    populateEntities() {
        if (!this._hass || !this.config || !this.dropdownList) {
            return;
        }
    
        // Fetch entities from Home Assistant - for example, filter for entities of type 'input_number'
        const filteredEntities = Object.keys(this._hass.states)
            .filter(entityId => entityId.startsWith('input_number.'))
            .map(entityId => {
                return {
                    entityId: entityId,
                    friendlyName: this._hass.states[entityId].attributes.friendly_name || entityId
                };
            });
    
        // Sort the entities by friendly name
        filteredEntities.sort((a, b) => a.friendlyName.localeCompare(b.friendlyName));
    
        // Clear any existing options
        this.dropdownList.innerHTML = '';
    
    
        // Populate the dropdown list with sorted entities
        filteredEntities.forEach(({ entityId, friendlyName }) => {
            let listItem = document.createElement('li');
    
            const stateObj = this._hass.states[entityId];
            const icon = stateObj.attributes.icon || 'mdi:motion-sensor';
    
            let itemContainer = document.createElement('div');
            itemContainer.style.display = 'flex';
            itemContainer.style.alignItems = 'center';
    
            if (icon) {
                let iconElement = document.createElement('ha-icon');
                iconElement.setAttribute('icon', icon);
                iconElement.style.marginRight = '8px';
                itemContainer.appendChild(iconElement);
            }
    
            let friendlyNameSpan = document.createElement('span');
            friendlyNameSpan.textContent = friendlyName;
            itemContainer.appendChild(friendlyNameSpan);
    
            listItem.appendChild(itemContainer);
    
            let entityIdSpan = document.createElement('span');
            entityIdSpan.textContent = entityId;
            entityIdSpan.style.display = 'block';
            entityIdSpan.style.fontSize = 'smaller';
            entityIdSpan.style.color = 'grey';
    
            listItem.appendChild(entityIdSpan);
    
            listItem.addEventListener('click', () => {
                this.setEntity(entityId);
            });
            this.dropdownList.appendChild(listItem);
        });
    }

    handleEntityChange(event) {
        const selectedOption = event.target.options[event.target.selectedIndex];
        this.displayElement.textContent = selectedOption.text;
        this.config.entity = selectedOption.value;
        this.dispatchEvent(new CustomEvent('config-changed', { 
            bubbles: true, 
            composed: true, 
            detail: { config: this.config }
        }));
    }
   
    handleAutomationChange(event) {
        const selectedOption = event.target.options[event.target.selectedIndex];
        this.displayElement.textContent = selectedOption.text;
        this.config.automation = selectedOption.value;
        this.dispatchEvent(new CustomEvent('config-changed', { 
            bubbles: true, 
            composed: true, 
            detail: { config: this.config }
        }));
    }
   
    // Combined method for handling step size input
    handleStepSizeInput(event) {
        const newStepSize = parseInt(event.target.value, 10); // Parse the input as a base-10 integer
        if (!isNaN(newStepSize)) {
            // Update the configuration with the new step size
            this.config = { ...this.config, stepSize: newStepSize };
    
            // Dispatch the config-changed event with the updated configuration
            this.dispatchEvent(new CustomEvent('config-changed', { 
                bubbles: true, 
                composed: true, 
                detail: { config: this.config }
            }));
        }
    }
    
    handleMaxValueInput(event) {
        const newMaxValue = parseFloat(event.target.value);
        if (!isNaN(newMaxValue)) {
            this.config = { ...this.config, maxValue: newMaxValue };
            this.dispatchEvent(new CustomEvent('config-changed', {
                bubbles: true,
                composed: true,
                detail: { config: this.config }
            }));
        }
    }

    handleSecondaryValueInput(event) {
        const newSecondaryValue = event.target.value;
        this.config = { ...this.config, secondaryValue: newSecondaryValue };
        this.dispatchEvent(new CustomEvent('config-changed', {
            bubbles: true,
            composed: true,
            detail: { config: this.config }
        }));
    }

    updateInputValue() {
        const entities = Object.keys(this._hass.states).filter(entityId => entityId.startsWith('input_number.'));
        
        if (this.config.entity && entities.includes(this.config.entity)) {
            const friendlyName = this._hass.states[this.config.entity].attributes.friendly_name || this.config.entity;
            this.dropdownInput.value = friendlyName;
        } else if (entities.length > 0 && !this.config.entity) {
            // If no entity is selected in the config, set to the first entity as default
            const defaultEntity = entities[0];
            const defaultFriendlyName = this._hass.states[defaultEntity].attributes.friendly_name || defaultEntity;
            this.dropdownInput.value = defaultFriendlyName;
            this.setEntity(defaultEntity);
        }
        // Set the step size
        if (this.config.stepSize !== undefined) {
            this.inputElement.value = this.config.stepSize;
        } else {
            // Set a default value if stepSize is not in the config
            this.inputElement.value = ''; // Set to empty if there is no stepSize defined
        }
        
        
        // Update the max value input based on the config
        if (this.config.maxValue !== undefined) {
            this.maxValueElement.value = this.config.maxValue;
        }
        
        // Update the secondary value input based on the config
        if (this.config.secondaryValue !== undefined) {
            this.secondaryValueElement.value = this.config.secondaryValue;
        }
        
        // Update the secondary value input based on the config
        if (this.config.onColor !== undefined) {
            this.onColorInputElement.value = this.config.onColor;
        }
        
        // Update the secondary value input based on the config
        if (this.config.offColor !== undefined) {
            this.offColorInputElement.value = this.config.offColor;
        }
        
        // Update the secondary value input based on the config
        if (this.config.ringColor !== undefined) {
            this.ringColorInputElement.value = this.config.ringColor;
        }
        
        // Update the secondary value input based on the config
        if (this.config.trackColor !== undefined) {
            this.trackColorInputElement.value = this.config.trackColor;
        }
        
    }
    
    setEntity(entity) {
        const friendlyName = this._hass.states[entity].attributes.friendly_name || entity;
        this.dropdownInput.value = friendlyName;
        this.config.entity = entity;
        this.dispatchEvent(new CustomEvent('config-changed', { 
            bubbles: true, 
            composed: true, 
            detail: { config: this.config }
        }));
        this.dropdownList.style.display = 'none';
    }
  
    populateAutomations() {
        if (!this._hass || !this.config || !this.automationDropdownList) {
            
            return;
        }
    
        // Fetch automation entities from Home Assistant
        const automationEntities = Object.keys(this._hass.states)
            .filter(entityId => entityId.startsWith('automation.'))
            .map(entityId => {
                return {
                    entityId: entityId,
                    friendlyName: this._hass.states[entityId].attributes.friendly_name || entityId
                };
            });
        console.log("Automation entities: ", automationEntities); // Log fetched automation entities

    
        // Sort the entities by friendly name
        automationEntities.sort((a, b) => a.friendlyName.localeCompare(b.friendlyName));
    
        // Clear any existing options in the automation dropdown
        this.automationDropdownList.innerHTML = '';
    
        // Populate the dropdown list with sorted automation entities
        automationEntities.forEach(({ entityId, friendlyName }) => {
            let listItem = document.createElement('li');
            listItem.style.cursor = 'pointer';
    
            const stateObj = this._hass.states[entityId];
            const icon = stateObj.attributes.icon || 'mdi:robot';
    
            let itemContainer = document.createElement('div');
            itemContainer.style.display = 'flex';
            itemContainer.style.alignItems = 'center';
    
            if (icon) {
                let iconElement = document.createElement('ha-icon');
                iconElement.setAttribute('icon', icon);
                iconElement.style.marginRight = '8px';
                itemContainer.appendChild(iconElement);
            }
    
            let friendlyNameSpan = document.createElement('span');
            friendlyNameSpan.textContent = friendlyName;
            itemContainer.appendChild(friendlyNameSpan);
    
            listItem.appendChild(itemContainer);
    
            let entityIdSpan = document.createElement('span');
            entityIdSpan.textContent = entityId;
            entityIdSpan.style.display = 'block';
            entityIdSpan.style.fontSize = 'smaller';
            entityIdSpan.style.color = 'grey';
    
            listItem.appendChild(entityIdSpan);
    
            listItem.addEventListener('click', () => {
                this.setAutomation(entityId);
                this.automationDropdownInput.value = friendlyName; // Update dropdown input value
            });
            this.automationDropdownList.appendChild(listItem);
    
            // Set the initial value of the dropdown based on the current configuration
            if (this.config.automation === entityId) {
                this.automationDropdownInput.value = friendlyName;
            }
        });
    }

    setAutomation(automationId) {
        const friendlyName = this._hass.states[automationId].attributes.friendly_name || automationId;
        this.automationDropdownInput.value = friendlyName;
        this.config.automation = automationId;
        this.dispatchEvent(new CustomEvent('config-changed', { 
            bubbles: true, 
            composed: true, 
            detail: { config: this.config }
        }));
        this.automationDropdownList.style.display = 'none';
    }

    handleOnColorChange(event) {
        const newOnColor = event.target.value;
        this.config = { ...this.config, onColor: newOnColor };
        this.dispatchEvent(new CustomEvent('config-changed', {
            bubbles: true,
            composed: true,
            detail: { config: this.config }
        }));
    }
    
    handleOffColorChange(event) {
        const newOffColor = event.target.value;
        this.config = { ...this.config, offColor: newOffColor };
        this.dispatchEvent(new CustomEvent('config-changed', {
            bubbles: true,
            composed: true,
            detail: { config: this.config }
        }));
    }
    
    
    handleRingColorChange(event) {
        const newRingColor = event.target.value;
        this.config = { ...this.config, ringColor: newRingColor };
        this.dispatchEvent(new CustomEvent('config-changed', {
            bubbles: true,
            composed: true,
            detail: { config: this.config }
        }));
    }
    
    
    handleTrackColorChange(event) {
        const newtrackColor = event.target.value;
        this.config = { ...this.config, trackColor: newtrackColor };
        this.dispatchEvent(new CustomEvent('config-changed', {
            bubbles: true,
            composed: true,
            detail: { config: this.config }
        }));
    }

}
  
customElements.define('rotating-helper-card-editor', RotatingHelperCardEditor);






// code to show the card in HA card-picker
const RotatingHelperCardDescriptor = {
    type: 'rotating-helper-card', // Must match the type you use in your YAML configuration
    name: 'Rotating Helper Card', // Friendly name for the card picker
    description: 'A custom card to show & set helper input-number in a circle slider', // Short description
    preview: false, // Optional: Set to true to show a preview in the picker
    documentationURL: 'https://justpaste.it/38sr8' // Optional: Link to your documentation
};

// Ensure window.customCards is initialized
window.customCards = window.customCards || [];

// Add your card to the customCards array
window.customCards.push(RotatingHelperCardDescriptor);







