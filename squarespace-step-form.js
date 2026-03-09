(function stepForms() {
    const url = new URL(window.location.href); // Current page's URL
    const urlParams = new URLSearchParams(url.search);
    const STEP_FORM_PROD = window.STEP_FORM_ACTIVATE || false;
    const FIRST_STEP_DEFAULT_NAME = window.FIRST_STEP_DEFAULT_NAME || 'FIRST STEP';
    const DEFAULT_ADD_TO_CART_TEXT = window.DEFAULT_ADD_TO_CART_TEXT || 'Register';
    const SUBMIT_FORM_API_URL = window.SUBMIT_FORM_API_URL || `${window.location.origin}/api/commerce/shopping-cart/entries`;
    const VALIDATE_FORM_API_URL = window.VALIDATE_FORM_API_URL || `${window.location.origin}/api/rest/forms/validate`;
    const CART_URL = window.CART_URL || `${window.location.origin}/cart`;
    const SUBMIT_TEMP_FORM_API_URL = window.SUBMIT_TEMP_FORM_API_URL || '';

    const AGE_NOT_ALLOWED_ERROR_TEXT = window.AGE_NOT_ALLOWED_ERROR_TEXT || 'This player does not meet the age requirements for this camp';

    const randomValue = Math.random().toString(36).substring(2, 15);

    const url_parameters = [];

    function extractUrlParameters() {
        const params = [];
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.forEach((value, key) => {
            url_parameters.push({ key, value });
        });
    }

    function getUrlParams() {
        return url_parameters;
    }

    function toCamelCase(str) {
        return str.toLowerCase()
            .replace(/[-_\s](.)/g, (_, char) => char.toUpperCase()) // Convert after hyphen/underscore
            .replace(/^(.)/, (_, char) => char.toLowerCase());    // Ensure first letter is lowercase
    }

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(";").shift();
    }

    function isValidEmail(email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    }

    function parseAges(input) {
        const match = input.match(/age[s|d] (\d+)\s*-\s*(\d+)/);
        if (match) {
            const minAge = parseInt(match[1], 10);
            const maxAge = parseInt(match[2], 10);
            return [minAge, maxAge];
        }
        return null; // Invalid string format
    }

    function parseStartCampDate(dateRange) {
        const match = dateRange.match(/(\d+)\s+([A-Za-z]+)/);
        if (match) {
            const day = parseInt(match[1], 10); // Day, e.g. 30
            const month = match[2]; // Month, e.g. June

            // Current year and month
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth(); // 0-11 (January = 0)

            // Create date for the nearest year
            const date = new Date(`${day} ${month} ${currentYear}`);
            const parsedMonth = date.getMonth(); // 0-11 (month from string)

            // If month in range is before current month, use next year
            if (parsedMonth < currentMonth) {
                date.setFullYear(currentYear + 1);
            }

            if (!isNaN(date)) {
                return date; // Return valid date
            }
        }
        return null; // Format did not match
    }

    function isAgeWithinRange(birthDate, eventStartDate, ageRange) {
        const [minAge, maxAge] = ageRange; // Unpack min and max age

        // Calculate age at event start
        const birth = birthDate;
        const eventStart = eventStartDate;

        let age = eventStart.getFullYear() - birth.getFullYear();

        // Adjust age if birthday has not occurred yet in event year
        const hasHadBirthdayThisYear =
            eventStart.getMonth() > birth.getMonth() ||
            (eventStart.getMonth() === birth.getMonth() && eventStart.getDate() >= birth.getDate());

        if (!hasHadBirthdayThisYear) {
            age -= 1;
        }

        // Check if age is within range
        return age >= minAge && age <= maxAge;
    }

    function addInlineStyle() {
        $('head').append(`
      <style>
      .modal {
          z-index: 100000000;
          position: fixed;
          height: 100dvh;
          width: 100%;
          top: 0;
          left: 0;
          background: rgb(0 0 0 / 25%);
          overflow: auto;
      }
      .modal-dialog {
          padding: 50px 0;
          position: relative;
          min-height: 100%;
          display: flex;
          align-items: center;
          box-sizing: border-box;
      }
      @media only screen and (max-width: 600px) {
          .modal-dialog {
              padding: 0px;
          }
      }
      .modal-content {
          max-width: 600px;
          margin: 0 auto;
          position: relative;
          padding: 40px;
          background: #fff;
          width: 100%;
      }
      @media only screen and (max-width: 600px) {
          .modal-content {
              min-height: 100dvh;
          }
      }
      .modal-close {
          position: absolute;
          color: #333;
          font-size: 22px;
          font-family: Arial, Helvetica, sans-serif;
          font-style: normal;
          width: 22px;
          line-height: 22px;
          top: 40px;
          right: 40px;
          text-align: center;
          margin: 0;
          cursor: pointer;
          border: none;
          outline: none;
          background: transparent;
          z-index: 1;
      }
      .form-wrapper {
          font-size: 14px;
          text-transform: none;
          font-style: normal;
          text-decoration: none;
      }
      .form-wrapper .form-title {
          font-size: 22px;
          line-height: 1.2em;
          margin-right: 22px;
          color: #333;
          margin-bottom: 40px;
      }
      .step-buttons {
          display: inline-flex;
          gap: 10px;
          flex-wrap: wrap;
      }
      .step-button {
          -webkit-appearance: none;
          appearance: none;
          background-color: #272727;
          border-width: 0;
          color: #fff;
          cursor: pointer;
          display: inline-block;
          font-family: Helvetica Neue, Helvetica, Arial, sans-serif;
          font-size: 12px;
          font-size: 14px;
          font-style: normal;
          font-weight: 400;
          height: auto;
          letter-spacing: 0;
          line-height: 1em;
          padding: 1em 2.5em;
          text-align: center;
          text-decoration: none;
          text-transform: uppercase;
          text-transform: none;
          width: auto;
          border-radius: 300px;
          transition: .1s opacity linear;
      }
      .step-button:hover {
          opacity: 0.8;
      }
      .step-button_bordered {
          background: transparent;
          border: 1px solid #272727;
          color: inherit;
          padding: 0.929em 2.5em;
      }
      .form-container {
          width: 100%;
          max-width: 500px;
          margin: auto;
      }
  
      .step:not(.active) {
          display: none;
      }
      </style>`);
    }

    function createPopup() {
        if ($("#dynamicPopup").length === 0) {
            $("body").append(`
                            <div class="modal" id="dynamicPopup" tabindex="-1" style="display: none; z-index: 999999;">
                                <div class="modal-dialog" role="document">
                                    <div class="modal-content sqs-async-form-content">
                                      <button type="button" class="modal-close" id="closePopup" aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                      </button>
                                      <div class="form-wrapper">
                                        <div class="modal-title form-title" id="dynamicPopupLabel"></div>
                                        <div class="modal-body">
                                            <div class="form-inner-wrapper">
                                                <form id="stepForm">
                                                    <textarea name="config_data" id="config_data" style="visibility: hidden;position: absolute;"></textarea>
                                                    <div class="field-list clear" id="form_div"></div>
                                                </form>
                                            </div>
                                        </div>
                                      </div>
                                    </div>
                                </div>
                            </div>
                        `);

            $("#closePopup").on("click", function () {
                $("#dynamicPopup").removeClass("show").css("display", "none");
                document.body.style.overflow = '';
            });
        }
    }

    function createFields(formConfig, currentStep = 0) {

        const $steps = [];

        formConfig.steps.forEach((step, index) => {
            const $stepDiv = $('<div class="step"></div>');
            if (index === currentStep) $stepDiv.addClass("active");

            const $stepHeader = $(`<div class="form-item section underline"></div>`);
            const $title = $(
                '<div class="title"></div>'
            ).text(step.title);
            const $description = !!step.description.length && $(
                '<div class="description"></div>'
            ).append(step.description);

            $stepHeader.append($title, $description);
            $stepDiv.append($stepHeader);

            step.fields.forEach((field) => {
                let classes = `form-item ${field.type}`;

                if (field.type === 'name' ||
                    field.type === 'phone' ||
                    field.type === 'address' ||
                    field.type === 'time' ||
                    field.type === 'date'
                ) {
                    classes += ' fields';
                } else {
                    classes += ' field';
                }

                if (field.type === 'currency' ||
                    field.type === 'website' ||
                    field.type === 'twitter'
                ) {
                    classes += ' hassymbol';
                }
                const $fieldContainer = $(`<div class="${classes}"></div>`);
                const $label = $('<label class="title"></label>').text(field.title);
                if (field.required) {
                    $label.append(" *");
                }
                $label.attr("for", field.id);

                const $description = !!field.description.length && $(
                    '<div class="description"></div>'
                ).append(field.description);

                const $error = $('<div class="field-error"></div>')
                    .hide();
                $fieldContainer.append($label, $description, $error);

                let $input;

                if (field.type !== "section") {
                    if (field.type === "select") {
                        $input = $("<select></select>").attr({
                            id: field.id,
                            name: field.id,
                            required: field.required,
                        });

                        field.options.forEach((option) => {
                            const $option = $("<option></option>").text(option).val(option);
                            $input.append($option);
                        });
                    } else if (
                        field.type === "text" ||
                        field.type === "email" ||
                        field.type === "password"
                    ) {
                        $input = $(`<input class='field-element ${field.type}'>`).attr({
                            type: field.type,
                            id: field.id,
                            name: field.id,
                            placeholder: field.placeholder,
                            required: field.required,
                        });
                    } else if (
                        field.type === "number"
                    ) {
                        $input = $(`<input class='field-element text'>`).attr({
                            type: 'text',
                            id: field.id,
                            name: field.id,
                            placeholder: field.placeholder,
                            required: field.required,
                        });
                    } else if (
                        field.type === "textarea"
                    ) {
                        $input = $(`<textarea class='field-element ${field.type}'>`).attr({
                            id: field.id,
                            name: field.id,
                            placeholder: field.placeholder,
                            required: field.required,
                        });
                    } else if (field.type === "website") {
                        $input = [$(`<input class='field-element ${field.type}'>`).attr({
                            type: 'text',
                            id: field.id,
                            name: field.id,
                            placeholder: field.placeholder,
                            required: field.required,
                        }), $(`<div class="prefix">http://</div>`)];
                    } else if (field.type === "twitter") {
                        $input = [$(`<input class='field-element ${field.type}'>`).attr({
                            type: 'text',
                            id: field.id,
                            name: field.id,
                            placeholder: field.placeholder,
                            required: field.required,
                        }), $(`<div class="prefix">@</div>`)];
                    } else if (field.type === "currency") {
                        $input = [$(`<input class='field-element ${field.type}'>`).attr({
                            type: 'text',
                            id: field.id,
                            name: field.id,
                            placeholder: field.placeholder,
                            required: field.required,
                        }), $(`<div class="prefix">${field.currencySymbol}</div>`)];
                    } else if (field.type === "likert") {
                        $input = $(`<fieldset id="${field.id}"></fieldset>`);
                        field.options.forEach((option) => {
                            const $option = $(`<fieldset data-question="${option}" class="item">
                      <legend class="question">${option}</legend>
                      <div class="option">
                        <label>
                          <input type="radio" name="${field.id}-field-${option}" value="-2" ${field.required && 'required="required"'}> Strongly Disagree
                        </label>
                      </div>
                      <div class="option">
                        <label>
                          <input type="radio" name="${field.id}-field-${option}" value="-1" ${field.required && 'required="required"'}> Disagree
                        </label>
                      </div>
                      <div class="option">
                        <label>
                          <input type="radio" name="${field.id}-field-${option}" value="0" ${field.required && 'required="required"'}> Neutral
                        </label>
                      </div>
                      <div class="option">
                        <label>
                          <input type="radio" name="${field.id}-field-${option}" value="1" ${field.required && 'required="required"'}> Agree
                        </label>
                      </div>
                      <div class="option">
                        <label>
                          <input type="radio" name="${field.id}-field-${option}" value="2" ${field.required && 'required="required"'}> Strongly Agree
                        </label>
                      </div>
                    </fieldset>`);
                            $input.append($option);
                        });
                    } else if (field.type === "name") {
                        $input = $(`<fieldset id="${field.id}"><div class="field first-name">
                                <label class="caption">
                                  <input class="field-element field-control" name="fname" x-autocompletetype="given-name" type="text" spellcheck="false" maxlength="30" data-title="First" ${field.required && 'required="required"'}>
                                  <span class="caption-text">First Name</span>
                                </label>
                              </div>
                              <div class="field last-name">
                                <label class="caption">
                                  <input class="field-element field-control" name="lname" x-autocompletetype="surname" type="text" spellcheck="false" maxlength="30" data-title="Last" ${field.required && 'required="required"'}>
                                  <span class="caption-text">Last Name</span>
                                </label>
                              </div></fieldset>`);
                    } else if (field.type === "date") {
                        $input = $(`<fieldset id="${field.id}"><div class="field day two-digits">
                    <label class="caption">
                      <input class="field-element" type="text" maxlength="2" data-title="Day" ${field.required && 'required="required"'}>
                      <span class="caption-text">DD</span>
                    </label>
                  </div><div class="field month two-digits">
                    <label class="caption">
                      <input class="field-element" type="text" maxlength="2" data-title="Month" ${field.required && 'required="required"'}>
                      <span class="caption-text">MM</span>
                    </label>
                  </div>
                  <div class="field year four-digits">
                    <label class="caption">
                      <input class="field-element" type="text" maxlength="4" data-title="Year" ${field.required && 'required="required"'}>
                      <span class="caption-text">YYYY</span>
                    </label>
                  </div></fieldset>`);
                    } else if (field.type === "time") {
                        $input = $(`<fieldset id="${field.id}"><div class="field hour two-digits">
                    <label class="caption">
                      <input class="field-element" type="text" maxlength="2" data-title="Hour" ${field.required && 'required="required"'}>
                      <span class="caption-text">Hour</span>
                    </label>
                  </div>
                  <div class="field minute two-digits">
                    <label class="caption">
                      <input class="field-element" type="text" maxlength="2" data-title="Minute" ${field.required && 'required="required"'}>
                      <span class="caption-text">Minute</span>
                    </label>
                  </div>
                  <div class="field second two-digits" style="display: none;">
                    <label class="caption">
                      <input class="field-element" type="text" maxlength="2" data-title="Second" value="00">
                      <span class="caption-text">Second</span>
                    </label>
                  </div>
                  <div class="field ampm">
                    <select class="field-element" data-title="Ampm" ${field.required && 'required="required"'}>
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div></fieldset>`);
                    } else if (field.type === "address") {
                        $input = $(`<fieldset id="${field.id}"><div class="field address1">
                    <label class="caption">
                      <input class="field-element field-control" name="address" x-autocompletetype="address-line1" type="text" spellcheck="false" data-title="Line1" ${field.required && 'required="required"'}>
                      <span class="caption-text">Address 1</span>
                    </label>
                  </div>
                  <div class="field address2">
                    <label class="caption">
                      <input class="field-element field-control" name="address2" x-autocompletetype="address-line2" type="text" spellcheck="false" data-title="Line2">
                      <span class="caption-text">Address 2</span>
                    </label>
                  </div>
                  <div class="field city">
                    <label class="caption">
                      <input class="field-element field-control" name="city" x-autocompletetype="city" type="text" spellcheck="false" data-title="City" ${field.required && 'required="required"'}>
                      <span class="caption-text">City</span>
                    </label>
                  </div>
                  <div class="field state-province">
                    <label class="caption">
                      <input class="field-element field-control" name="state" x-autocompletetype="state" type="text" spellcheck="false" data-title="State" ${field.required && 'required="required"'}>
                      <span class="caption-text">State/Province</span>
                    </label>
                  </div>
                  <div class="field zip">
                    <label class="caption">
                      <input class="field-element field-control" name="zipcode" x-autocompletetype="postal-code" type="text" spellcheck="false" data-title="Zip" ${field.required && 'required="required"'}>
                      <span class="caption-text">Zip/Postal Code</span>
                    </label>
                  </div>
                  <div class="field country">
                    <label class="caption">
                      <input class="field-element field-control" name="country" x-autocompletetype="country" type="text" spellcheck="false" data-title="Country" ${field.required && 'required="required"'}>
                      <span class="caption-text">Country</span>
                    </label>
                  </div></fieldset>`);
                    } else if (field.type === "phone") {
                        let countryCode = field.showCountryCode && `` || '';
                        $input = $(`<fieldset id="${field.id}">
                  <div class="field text two-digits" ${!field.showCountryCode && 'style="display:none"'}>
                    <label class="caption">
                      <input class="field-element" x-autocompletetype="phone-country-code" type="text" maxlength="5" data-title="Country" ${field.showCountryCode && field.required && 'required="required"'}>
                      <span class="caption-text">Country</span>
                    </label>
                  </div>
                  <div class="field text three-digits">
                    <label class="caption">
                      <input class="field-element" x-autocompletetype="phone-area-code" type="text" maxlength="3" data-title="Areacode" ${field.required && 'required="required"'}>
                      <span class="caption-text">(###)</span>
                    </label>
                  </div>
                  <div class="field text three-digits">
                    <label class="caption">
                      <input class="field-element" x-autocompletetype="phone-local-prefix" type="text" maxlength="3" data-title="Prefix" ${field.required && 'required="required"'}>
                      <span class="caption-text">###</span>
                    </label>
                  </div>
                  <div class="field text four-digits">
                    <label class="caption">
                      <input class="field-element" x-autocompletetype="phone-local-suffix" type="text" maxlength="4" data-title="Line" ${field.required && 'required="required"'}>
                      <span class="caption-text">####</span>
                    </label>
                  </div></fieldset>`);
                    } else if (field.type === "radio") {
                        $input = $('<div class="radio-group"></div>');
                        field.options.forEach((option) => {
                            const $radioOption = $(
                                `<div class="option"><label><input type="radio" name="${field.id
                                }" value="${option}" ${field.required ? "required" : ""
                                }> ${option}</label></div>`
                            );
                            $input.append($radioOption);
                        });
                    } else if (field.type === "checkbox") {
                        $input = $('<div class="checkbox-group"></div>');
                        field.options.forEach((option) => {
                            const $checkboxOption = $(
                                `<div class="option"><label><input type="checkbox" name="${field.id
                                }" value="${option}" ${field.required ? "required" : ""
                                }> ${option}</label></div>`
                            );
                            $input.append($checkboxOption);
                        });
                    }

                    const $inputWrapper = $('<div class="input-wrapper"></div>').append(
                        $input
                    );
                    $fieldContainer.append($inputWrapper);
                }

                $stepDiv.append($fieldContainer);
            });

            const $btnsWrapper = $stepDiv.append('<div class="step-buttons"></div>').find('.step-buttons');

            if (index > 0) {
                const $backButton = $('<button type="button" class="step-button step-button_bordered prev-step-button">Back</button>');
                $btnsWrapper.append($backButton);
            }

            const $nextButton = $('<button type="button" class="step-button next-step-button">Next</button>');

            if (index < formConfig.steps.length - 1) {
                $btnsWrapper.append($nextButton);
            } else {
                const $addToCartButton = $(
                    '<button type="button" class="step-button step-add-to-cart">Add to Cart</button>'
                );
                $btnsWrapper.append($addToCartButton);
            }
            //console.log($form_div.html());
            $steps.push($stepDiv);
        });

        return $steps;
    }

    function stepForm($addToCart) {
        const config_data = { fields: [], url_parameters: [], form_title: "" };
        const rawData = $($addToCart).closest('.product-block').attr("data-product");

        const formConfig = {};

        if (!rawData) {
            console.error("Data-product attribute is missing.");
            document.dispatchEvent(new CustomEvent("stepFormInitFailed"));
            return;
        }

        const parsedConfig = JSON.parse(rawData);

        let selectedVariation = null;

        let currentStep = 0;

        function createConfigData() {
            const steps = [];
            let currentStepFields = [];
            let currentStepIndex = 0;

            function ifException(field) {
                let res = false;
                if (!field.underline) {
                    res = true;
                }

                return res;
            }

            parsedConfig.additionalFieldsForm.fields.forEach((field, index) => {

                field = JSON.parse(field);

                if (index === 0 && field.type !== 'section') {
                    steps.push({
                        title: FIRST_STEP_DEFAULT_NAME,
                        description: '',
                        fields: [],
                    });
                }

                if (field.type !== 'section' || ifException(field)) {
                    steps[currentStepIndex].fields.push(field);
                    config_data.fields.push(field);
                } else {
                    steps.push({
                        title: field.title,
                        description: field.description,
                        fields: [],
                    });
                    index > 0 && currentStepIndex++;
                }

            });
            formConfig.steps = steps;
            config_data.form_title = parsedConfig.additionalFieldsForm.name;
            config_data.url_parameters = getUrlParams();
        }

        function createForm() {

            const $poptupTitle = $("#dynamicPopupLabel");
            const $form = $("#stepForm");
            const $form_div = $("#form_div");

            currentStep = 0;

            const configTextarea = document.getElementById("config_data");
            if (configTextarea) {
                configTextarea.value = JSON.stringify(config_data, null, 2);
            } else {
                console.error("Textarea with id 'config_data' is missing.");
            }

            //$form.empty();
            $form_div.empty();

            $form_div.append(createFields(formConfig, currentStep));

            $('.prev-step-button').on("click", previousStep);
            $('.next-step-button').on("click", () => {
                apiValidateStep().then(() => {
                    let stepLeavedName = `form step ${currentStep} added`;
                    if (formConfig.steps[currentStep]) {
                        stepLeavedName = `form ${formConfig.steps[currentStep].title} added`
                    }
                    stepLeavedName = toCamelCase(stepLeavedName);
                    document.dispatchEvent(new CustomEvent("formStepLeaved", {
                        detail: {
                            formName: parsedConfig.additionalFieldsForm.name || '',
                            stepLeavedName: stepLeavedName
                        }
                    }));
                    submitTempForm();
                    nextStep();
                })
            });
            $('.step-add-to-cart').on("click", () => {
                apiValidateStep().then(() => {
                    document.dispatchEvent(new CustomEvent("addToCartFormSubmit", {
                        detail: {
                            formName: parsedConfig.additionalFieldsForm.name || '',
                            paymentOption: selectedVariation && selectedVariation.attributes && Object.values(selectedVariation.attributes)[0] || '',
                            productId: parsedConfig.id
                        }
                    }));
                    submitTempForm(true);
                    submitForm();
                })
            });

        }

        function submitForm() {
            // Collect form data
            const formData = getFormData();

            const crumbValue = getCookie("crumb"); // Assumes getCookie is defined elsewhere

            $.ajax({
                type: "POST",
                url: `${SUBMIT_FORM_API_URL}?crumb=${crumbValue}`,
                data: JSON.stringify({
                    itemId: parsedConfig.id,
                    sku: selectedVariation && selectedVariation.sku || null,
                    additionalFields: JSON.stringify(formData),
                }),
                contentType: "application/json",
                success: function (response) {
                    if (!response.errors) {
                        window.location.href = CART_URL;
                    } else {
                        const errors = JSON.parse(response.errors);
                        for (let key in errors) {
                            showErrorInFieldId(key, errors[key]);
                        }

                        goToStepWithError();

                    }
                },
                error: function (error) {
                    document.dispatchEvent(new CustomEvent("stepFormInitFailed"));
                    // console.error("Error:", error);
                },
            });
        }

        function disableNextButton($button) {
            const allRequiredFields = $("#stepForm").find("[required]");
            const isValid = [...allRequiredFields].every((field) => {
                // Check for select
                if ($(field).is("select") && $(field).val() === "Please select") {
                    return false;
                }
                // Check for all other fields
                return field.type === "checkbox"
                    ? field.checked
                    : field.value.trim() !== "";
            });

            if (isValid) {
                $button.prop("disabled", false); // Allow proceeding to next step
            } else {
                $button.prop("disabled", true); // Disable button if fields are not filled
            }
        }

        function showErrorInFieldId(id, text = 'Required') {
            const $error = $(`.form-item:has(#${id}) .field-error`);
            $error && $error.text(text).show();
        }

        function getFieldValue(field) {
            let value = '';
            if (field.type === "checkbox") {
                const checkedValues = $(`[name="${field.id}"]:checked`)
                    .map(function () {
                        return $(this).val();
                    })
                    .get();

                if (checkedValues.length) {
                    value = checkedValues;
                }
            } else if (field.type === "radio") {
                const checkedOption = $(`[name="${field.id}"]:checked`)
                if (checkedOption.length) {
                    value = $(checkedOption).val();
                }
            } else if (field.type === "name" ||
                field.type === "address" ||
                field.type === "phone" ||
                field.type === "time"
            ) {
                const inputs = $(`fieldset#${field.id} input, fieldset#${field.id} select`);
                const fieldValue = [];
                for (let input of inputs) {
                    fieldValue.push(input.value);
                }
                if (!!fieldValue.length) {
                    value = fieldValue;
                }
            } else if (field.type === "likert") {
                const items = $(`fieldset#${field.id} .item`);
                const fieldValue = {};
                for (let item of items) {
                    const name = item.dataset.question;
                    const checkedOption = item.querySelector('input:checked')
                    fieldValue[name] = checkedOption && checkedOption.value || '';
                }
                if (!$.isEmptyObject(fieldValue)) {
                    value = fieldValue;
                }
            } else if (field.type === "date") {
                const inputs = $(`fieldset#${field.id} input`);

                // Change order of item because date in format MM/DD/YYYY
                let temp = inputs[0];
                inputs[0] = inputs[1];
                inputs[1] = temp;

                const fieldValue = [];
                for (let input of inputs) {
                    fieldValue.push(input.value);
                }
                if (!!fieldValue.length) {
                    value = fieldValue;
                }
            } else if (field.type === "select") {
                const fieldValue = $(`[name=${field.id}]`).val();
                if (fieldValue !== 'Please select') {
                    value = fieldValue;
                }
            } else {
                // For other field types use regular value
                const fieldValue = $(`[name=${field.id}]`).val();
                if (fieldValue) {
                    value = fieldValue;
                }
            }

            return value;
        }

        function getFormData() {
            const formData = {};
            formConfig.steps.forEach((step) => {
                step.fields.forEach((field) => {
                    const value = getFieldValue(field);
                    formData[field.id] = value
                });
            });

            return formData;
        }

        function getActiveStepData() {
            const formData = {};
            const step = formConfig.steps[currentStep];
            step.fields.forEach((field) => {
                const value = getFieldValue(field);
                formData[field.id] = value;
            });

            return formData;
        }

        function getMinMaxAge() {
            let value = '';
            for (let fieldObj of config_data.fields) {
                if ((fieldObj.title || '').toLowerCase() !== "camp option") continue;
                value = getFieldValue(fieldObj);
            }

            return !!value && parseAges(value) || null;

        }

        function getCampStartDate() {
            let value = '';
            for (let fieldObj of config_data.fields) {
                if ((fieldObj.title || '').toLowerCase() !== "camp dates") continue;
                value = getFieldValue(fieldObj);
            }

            return !!value && parseStartCampDate(value) || null;
        }

        function isBirthDateValid(id) {
            const dateBirthArr = Array.from($(`fieldset#${id} input`)).map((input, i) => {
                let numbers = i < 2 && 2 || 0;
                return (+input.value).toString().padStart(numbers, 0);
            });

            if (dateBirthArr[0] === '00' || dateBirthArr[1] === '00' || dateBirthArr[2] === '') return true;

            const dateBirthDate = new Date(`${dateBirthArr[2]}/${dateBirthArr[1]}/${dateBirthArr[0]}`);

            const allowedAge = getMinMaxAge();
            const startCampDate = getCampStartDate();

            if (!allowedAge || !startCampDate) return true;

            return isAgeWithinRange(dateBirthDate, startCampDate, allowedAge);
        }

        function localValidate() {
            const errors = {};

            for (let fieldObj of config_data.fields) {
                if ((fieldObj.title || '').toLowerCase() === "date of birth") {
                    if (!isBirthDateValid(fieldObj.id)) {
                        errors[fieldObj.id] = AGE_NOT_ALLOWED_ERROR_TEXT;
                    }
                }
            }

            return errors;
        }

        function apiValidateStep() {
            const formData = getFormData();
            const formId = parsedConfig.additionalFieldsForm.id;
            const crumbValue = getCookie("crumb"); // Assumes getCookie is defined elsewhere

            const customErrors = localValidate();

            return new Promise((resolve, reject) => {
                $.ajax({
                    type: "POST",
                    url: `${VALIDATE_FORM_API_URL}/${formId}?crumb=${crumbValue}`,
                    data: JSON.stringify(formData),
                    contentType: "application/json",
                    complete: function (res, status) {
                        const resJSON = res.responseJSON;

                        for (let key in customErrors) {
                            resJSON.errors[key] = customErrors[key];
                        }

                        if (!resJSON.errors) return resolve();

                        const errors = resJSON.errors;

                        $(".step .field-error").hide();

                        let isStepValidate = true;

                        for (let key in errors) {
                            const $formItem = $(`.step.active .form-item:has(#${key}, [name="${key}"])`);
                            if (!$formItem.length) continue;
                            const $error = $formItem.find(".field-error");
                            $error.text(errors[key]).show();
                            isStepValidate = false;
                        }

                        if (isStepValidate) {
                            resolve();
                        } else {
                            reject();
                        }


                    }
                });
            });
        }

        function submitTempForm(formCompleted = false) {
            // Collect all form data
            const formData = {};

            formConfig.steps.forEach((step) => {
                for (let field of step.fields) {
                    let fieldValue = "";

                    if (field.type === "password") continue;

                    // Checkboxes
                    if (field.type === "checkbox") {
                        fieldValue = [];
                        $(`[name=${field.id}]:checked`).each(function () {
                            fieldValue.push($(this).val());
                        });

                        if (fieldValue.length > 0) {
                            formData[field.id] = fieldValue;
                        }
                    }
                    // Radio buttons
                    else if (field.type === "radio") {
                        fieldValue = $(`[name=${field.id}]:checked`).val();
                        if (fieldValue) {
                            formData[field.id] = fieldValue;
                        }
                    }
                    // Select
                    else if (field.type === "select") {
                        fieldValue = $(`[name=${field.id}]`).val();
                        if (fieldValue === "Please select") {
                            fieldValue = ""; // If "Please select" is chosen, send empty value
                        }
                        if (fieldValue) {
                            formData[field.id] = fieldValue;
                        }
                    }
                    // Field with multiple inputs
                    else if (field.type === "name" ||
                        field.type === "address" ||
                        field.type === "phone" ||
                        field.type === "time"
                    ) {
                        const inputs = $(`fieldset#${field.id} input, fieldset#${field.id} select`);
                        const fieldValue = [];
                        for (let input of inputs) {
                            fieldValue.push(input.value);
                        }
                        if (!!fieldValue.length) {
                            formData[field.id] = fieldValue.join(' ');
                        }
                    } else if (field.type === "likert") {
                        const items = $(`fieldset#${field.id} .item`);
                        const fieldValue = [];
                        for (let item of items) {
                            const name = item.dataset.question;
                            const values = {
                                '-2': 'Strongly Disagree',
                                '-1': 'Disagree',
                                '0': 'Neutral',
                                '1': 'Agree',
                                '2': 'Strongly Agree'
                            }
                            const inputChecked = item.querySelector('input:checked');
                            const val = inputChecked && values[inputChecked.value] || '';
                            fieldValue.push(`${name}: ${val}`)
                        }
                        if (fieldValue.length) {
                            formData[field.id] = fieldValue.join(';');
                        }
                    } else if (field.type === "date") {
                        const inputs = $(`fieldset#${field.id} input`);

                        // Change order of item because date in format MM/DD/YYYY
                        let temp = inputs[0];
                        inputs[0] = inputs[1];
                        inputs[1] = temp;

                        const fieldValue = [];
                        for (let input of inputs) {
                            fieldValue.push(input.value);
                        }
                        if (!!fieldValue.length) {
                            formData[field.id] = fieldValue.join('/');
                        }
                    }
                    // Text fields
                    else {
                        fieldValue = $(`[name=${field.id}]`).val();
                        if (fieldValue) {
                            formData[field.id] = fieldValue;
                        }
                    }
                };

                // Add config_data to formData
                formData["config_data"] = $(`[name=${"config_data"}]`).val();
            });

            const crumbValue = getCookie("crumb"); // Assumes getCookie is defined elsewhere

            !!SUBMIT_TEMP_FORM_API_URL && $.ajax({
                type: "POST",
                url: SUBMIT_TEMP_FORM_API_URL,
                data: JSON.stringify({
                    randomValue: randomValue,
                    tm: +new Date(),
                    formCompleted,
                    formData: formData, // Send all form data
                }),
                contentType: "application/json",
                // success: function (response) {
                //   console.log("Form submitted successfully:", response);
                // },
                // error: function (error) {
                //   console.error("Error submitting form:", error);
                // },
            });
        }

        function nextStep() {
            $(".step").eq(currentStep).removeClass("active");
            currentStep++;
            $(".step").eq(currentStep).addClass("active");
        }

        function previousStep() {
            $(".step").eq(currentStep).removeClass("active");
            currentStep--;
            $(".step").eq(currentStep).addClass("active");
        }

        function goToStep(stepIndex) {
            if (stepIndex === currentStep) return;
            $(".step").eq(currentStep).removeClass("active");
            $(".step").eq(stepIndex).addClass("active");
            currentStep = stepIndex;
        }

        function goToStepWithError() {
            const steps = $('.step');
            let index = 0;
            for (let step of steps) {
                if ($(step).find('.field-error[style=""]').length) {
                    goToStep(index);
                    break;
                }
                index++;
            }
        }

        function init() {

            $($addToCart).after(
                $("<button>", {
                    text: $($addToCart).find('.sqs-add-to-cart-button-inner').text() || DEFAULT_ADD_TO_CART_TEXT,
                    class: "new-add-to-cart-button sqs-suppress-edit-mode sqs-editable-button sqs-button-element--primary",
                    click: function () {

                        const $selectedVariant = $($addToCart).closest('.product-block').find('.product-variants select');
                        if ($selectedVariant.length) {
                            const value = $selectedVariant.val();
                            if (!value) {
                                $($addToCart).click();
                                return;
                            }
                            selectedVariation = parsedConfig.variants.find((vara) => Object.values(vara.attributes).includes(value));
                        }

                        createForm();

                        document.dispatchEvent(new CustomEvent("formOpened", {
                            detail: {
                                productId: parsedConfig.id,
                                formName: parsedConfig.additionalFieldsForm.name || '',
                            }
                        }));

                        // Open popup with form
                        $("#dynamicPopup").css("display", "block").addClass("show");
                        $("#dynamicPopupLabel").text(parsedConfig.additionalFieldsForm.name);
                        document.body.style.overflow = 'hidden';
                        // Populate form if needed
                    },
                })
            );
            $($addToCart).hide();

            createConfigData();
            // createForm();
        }

        init();

    }

    function init() {
        addInlineStyle();
        extractUrlParameters();
        createPopup();

        const $useFormElement = $(".sqs-add-to-cart-button");
        for (let $addToCart of $useFormElement) {
            stepForm($addToCart);
        }
    }

    if (STEP_FORM_PROD || urlParams.get("dev") !== null) {
        let inited = false;
        $(document).ready(function () {
            init();
            inited = true;
        });

        window.addEventListener('pageshow', (event) => {
            if (inited) return;
            for (let item of $('.product-variants').find('select')) {
                item.dispatchEvent(new Event('change'));
            }
            $("#closePopup").click();
        });
    }

})();