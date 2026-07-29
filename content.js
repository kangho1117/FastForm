// FastForm - Content Script
// Handles smart field detection, 5-language cross-lingual custom fields, and autofill

(() => {
  'use strict';

  // ─── Field Mapping Rules (International) ─────────────────────────
  const FIELD_PATTERNS = {
    firstName: {
      keywords: ['first_name', 'first-name', 'firstname', 'given_name', 'given-name', 'givenname', 'forename', 'fname', 'first'],
      excludeKeywords: ['last', 'full', 'email', 'company', 'middle']
    },
    lastName: {
      keywords: ['last_name', 'last-name', 'lastname', 'family_name', 'family-name', 'familyname', 'surname', 'lname', 'last'],
      excludeKeywords: ['first', 'full', 'email', 'company', 'middle']
    },
    name: {
      keywords: ['name', 'full_name', 'fullname', 'your-name', 'your_name', 'customer_name', 'real_name', 'realname', 'contact_name', '이름', '성명', '성함', '名前', '氏名', '姓名'],
      excludeKeywords: ['first', 'last', 'nick', 'login', 'file', 'company', 'domain', 'brand']
    },
    email: {
      keywords: ['email', 'e-mail', 'mail', 'e_mail', 'emailaddress', 'email_address', 'user_email', '이메일', '메일', 'メール', '邮箱'],
      excludeKeywords: ['confirm', 'verification', 'secondary']
    },
    phone: {
      keywords: ['phone', 'tel', 'telephone', 'mobile', 'cell', 'cellphone', 'phonenumber', 'phone_number', 'contact_number', 'mobile_number', 'dial', '전화', '연락처', '핸드폰', '휴대폰', '電話番号', '电话'],
      excludeKeywords: ['fax', 'extension', 'country_code']
    },
    businessNumber: {
      keywords: ['business_number', 'business-number', 'businessnumber', 'tax_id', 'taxid', 'vat', 'vat_number', 'vat_id', 'ein', 'ssn', 'registration_number', 'company_number', 'brn', 'crn', 'tax_code', 'gstin', 'nif', 'cif', '사업자', '사업자등록', '등록번호', '税務番号', '税号'],
      excludeKeywords: []
    },
    address: {
      keywords: ['address', 'addr', 'street', 'street_address', 'address_line_1', 'address1', 'addr1', 'location', '주소', '도로명', '住所', '地址'],
      excludeKeywords: ['email', 'ip', 'mac', 'url', 'web', 'address2', 'addr2', 'address_line_2']
    },
    addressDetail: {
      keywords: ['address2', 'address_2', 'addr2', 'address_line_2', 'address_detail', 'detail_address', 'apt', 'suite', 'unit', 'building', 'floor', '상세주소', '동호수', '建物名', '详细地址'],
      excludeKeywords: []
    },
    city: {
      keywords: ['city', 'town', 'municipality', 'locality', '도시', '시/군/구', '市区町村', '城市'],
      excludeKeywords: ['state', 'country', 'address', 'capacity']
    },
    state: {
      keywords: ['state', 'province', 'region', 'county', 'territory', 'canton', '주', '도', '시/도', '都道府県', '省'],
      excludeKeywords: ['country', 'zip', 'statement']
    },
    zipcode: {
      keywords: ['zip', 'zipcode', 'zip_code', 'postal', 'postal_code', 'postalcode', 'postcode', 'post_code', 'pin_code', 'pincode', '우편번호', '郵便番号', '邮政编码'],
      excludeKeywords: []
    },
    country: {
      keywords: ['country', 'nation', 'country_name', '국가', '국적', '国', '国家'],
      excludeKeywords: ['country_code', 'code']
    },
    company: {
      keywords: ['company', 'company_name', 'companyname', 'organization', 'org', 'business_name', 'corp', 'corporation', 'employer', '회사', '회사명', '상호', '会社名', '公司'],
      excludeKeywords: []
    },
    department: {
      keywords: ['department', 'dept', 'division', 'team', '부서', '팀', '部署', '部门'],
      excludeKeywords: []
    },
    position: {
      keywords: ['position', 'title', 'job_title', 'jobtitle', 'role', 'occupation', '직위', '직책', '직급', '役職', '职位'],
      excludeKeywords: ['page_title', 'site_title', 'document']
    },
    note: {
      keywords: ['note', 'notes', 'comment', 'comments', 'message', 'memo', 'remark', 'remarks', 'description', 'additional', 'etc', 'special_instructions', '비고', '메모', '요청사항', '備考', '备注'],
      excludeKeywords: ['error']
    }
  };

  // ─── 5-Language Cross-Lingual Thesaurus Matrix ─────────────────────
  // Supports: English (en), Korean (ko), Japanese (ja), Chinese (zh_CN), Spanish (es)
  const SYNONYM_GROUPS = [
    // Passport
    ['passport', 'pass_port', 'pp_num', 'passport_no', 'passport_number', 'passportno', '여권', '여권번호', '여권_번호', 'パスポート', 'パスポート番号', '护照', '护照号', '护照号码', 'pasaporte', 'num_pasaporte'],

    // Driver's License
    ['license', 'licence', 'driver_license', 'driver_licence', 'dl_number', 'driver_id', '운전면허', '면허', '면허번호', '運転免許', '免許証', '驾照', '驾驶证', '驾驶执照', 'licencia', 'licencia_conducir', 'carnet_conducir'],

    // National ID / SSN / DNI / MyNumber
    ['ssn', 'social_security', 'national_id', 'id_number', 'id_no', 'personal_id', 'identity', '주민번호', '주민등록번호', '신분증', 'マイナンバー', '身份证', '身份证号', '身份证号码', 'dni', 'cedula', 'identificacion'],

    // Tax ID / VAT / Business Registration
    ['vat', 'vat_id', 'vat_number', 'tax_id', 'tax_code', 'ein', 'business_number', '사업자', '사업자번호', '사업자등록번호', '税務番号', '税号', '纳税人识别号', 'nif', 'cif', 'registro_fiscal'],

    // Crypto Wallet
    ['wallet', 'crypto', 'eth_address', 'btc_address', 'wallet_address', 'crypto_wallet', '지갑', '지갑주소', '暗号資産', 'ウォレット', '钱包', '钱包地址', 'billetera', 'direccion_billetera'],

    // Emergency Contact
    ['emergency', 'emergency_contact', 'ice_phone', '비상연락처', '비상연락', '긴급연락처', '緊急連絡先', '紧急联系人', 'contacto_emergencia'],

    // Payment & Social Messengers
    ['paypal', 'paypal_email', 'paypal_id', '페이팔', 'ペイパル', '贝宝'],
    ['instagram', 'insta', 'ig_handle', 'ig_profile', '인스타', '인스타그램', 'インスタ', 'インスタグラム', '小红书', 'redbook'],
    ['facebook', 'fb_profile', 'fb_id', '페이스북', '페북', 'フェイスブック', '脸书'],
    ['twitter', 'x_handle', 'x_profile', 'tweet', '트위터', 'ツイッター', '推特'],
    ['linkedin', 'linkedin_url', 'linkedin_profile', '링크드인', 'リンクトイン', '领英'],
    ['telegram', 'tg_handle', 'tg_id', '텔레그램', '텔레', 'テレグラム', '电报'],
    ['wechat', 'wx_id', 'weixin', '위챗', 'ウィーチャット', '微信', '微信号'],
    ['kakao', 'kakaotalk', 'kakao_id', '카카오', '카카오톡', '카톡', 'カカオ'],
    ['line', 'line_id', '라인', '라인아이디', 'ライン'],
    ['whatsapp', 'wa_num', '왓츠앱', 'ワッツアップ', 'whatsapp'],
    ['github', 'github_url', 'git', '깃허브', '깃헙', 'ギットハブ']
  ];

  /**
   * Find all cross-lingual synonyms for a given label string
   */
  function getSynonymKeywords(label) {
    if (!label) return [];
    const cleanLabel = label.toLowerCase().trim().replace(/[\s_-]+/g, '');

    const keywordsSet = new Set([label.toLowerCase().trim()]);

    for (const group of SYNONYM_GROUPS) {
      const match = group.some(term => {
        const cleanTerm = term.toLowerCase().replace(/[\s_-]+/g, '');
        return cleanLabel.includes(cleanTerm) || cleanTerm.includes(cleanLabel);
      });

      if (match) {
        group.forEach(term => keywordsSet.add(term));
      }
    }

    return Array.from(keywordsSet);
  }

  // ─── Helper Functions ──────────────────────────────────────────────

  function getFieldSignature(element) {
    const attrs = [
      element.getAttribute('name'),
      element.getAttribute('id'),
      element.getAttribute('placeholder'),
      element.getAttribute('aria-label'),
      element.getAttribute('autocomplete'),
      element.getAttribute('data-label'),
      element.getAttribute('title')
    ];

    const label = getAssociatedLabel(element);
    if (label) attrs.push(label);

    return attrs
      .filter(Boolean)
      .map(s => s.toLowerCase().trim())
      .join(' ');
  }

  function getAssociatedLabel(element) {
    if (element.id) {
      const label = document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
      if (label) return label.textContent;
    }

    const parentLabel = element.closest('label');
    if (parentLabel) return parentLabel.textContent;

    const parent = element.parentElement;
    if (parent) {
      const labels = parent.querySelectorAll('label');
      for (const label of labels) {
        if (label.textContent.trim()) return label.textContent;
      }
      const prevSibling = element.previousElementSibling;
      if (prevSibling && ['SPAN', 'DIV', 'P', 'STRONG', 'B'].includes(prevSibling.tagName)) {
        return prevSibling.textContent;
      }
    }

    return null;
  }

  function detectFieldType(element) {
    const signature = getFieldSignature(element);
    if (!signature) return null;

    const autocomplete = element.getAttribute('autocomplete');
    if (autocomplete) {
      const acMap = {
        'given-name': 'firstName',
        'family-name': 'lastName',
        'name': 'name',
        'email': 'email',
        'tel': 'phone', 'tel-national': 'phone',
        'street-address': 'address', 'address-line1': 'address',
        'address-line2': 'addressDetail',
        'address-level2': 'city',
        'address-level1': 'state',
        'postal-code': 'zipcode',
        'country-name': 'country',
        'organization': 'company',
        'organization-title': 'position'
      };
      const mapped = acMap[autocomplete.toLowerCase()];
      if (mapped) return mapped;
    }

    let bestMatch = null;
    let bestScore = 0;

    for (const [fieldType, patterns] of Object.entries(FIELD_PATTERNS)) {
      const excluded = patterns.excludeKeywords.some(kw => signature.includes(kw));
      if (excluded) continue;

      let score = 0;
      for (const keyword of patterns.keywords) {
        if (signature.includes(keyword)) {
          score += keyword.length;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = fieldType;
      }
    }

    return bestMatch;
  }

  function setFieldValue(element, value) {
    if (!value) return false;

    element.focus();

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    )?.set;
    const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype, 'value'
    )?.set;

    if (element.tagName === 'TEXTAREA' && nativeTextAreaValueSetter) {
      nativeTextAreaValueSetter.call(element, value);
    } else if (nativeInputValueSetter) {
      nativeInputValueSetter.call(element, value);
    } else {
      element.value = value;
    }

    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));

    return true;
  }

  function getAllFormFields() {
    const selectors = [
      'input[type="text"]',
      'input[type="email"]',
      'input[type="tel"]',
      'input[type="number"]',
      'input[type="search"]',
      'input[type="url"]',
      'input:not([type])',
      'textarea',
      'select'
    ];

    const fields = document.querySelectorAll(selectors.join(', '));
    return Array.from(fields).filter(field => {
      if (field.type === 'hidden') return false;
      if (field.disabled) return false;
      if (field.readOnly) return false;
      if (field.offsetParent === null && getComputedStyle(field).position !== 'fixed') return false;
      return true;
    });
  }

  // ─── Main Fill Function ────────────────────────────────────────────

  function fillForm(profile) {
    const fields = getAllFormFields();
    let filledCount = 0;
    const filledFields = [];
    const filledElementsSet = new Set();

    const activeProfile = { ...profile };

    // ─── Precise Name Separation & Parsing Engine ─────────────────────
    let fn = (activeProfile.firstName || '').trim();
    let ln = (activeProfile.lastName || '').trim();
    let full = (activeProfile.name || '').trim();

    if (full && (!fn || !ln)) {
      const parts = full.split(/\s+/);
      if (parts.length > 1) {
        fn = fn || parts[0];
        ln = ln || parts.slice(1).join(' ');
      } else {
        fn = fn || full;
      }
    }

    if (fn.includes(' ') && !ln) {
      const parts = fn.split(/\s+/);
      fn = parts[0];
      ln = parts.slice(1).join(' ');
    }

    activeProfile.firstName = fn;
    activeProfile.lastName = ln;
    activeProfile.name = full || `${fn} ${ln}`.trim();

    // 1. Standard Fields Fill
    for (const field of fields) {
      const fieldType = detectFieldType(field);
      if (!fieldType) continue;

      let value = activeProfile[fieldType];

      if (!value) continue;

      if (field.value === value) continue;

      if (field.tagName === 'SELECT') {
        const options = Array.from(field.options);
        for (const opt of options) {
          if (opt.value.toLowerCase() === value.toLowerCase() || opt.text.toLowerCase().includes(value.toLowerCase())) {
            field.value = opt.value;
            field.dispatchEvent(new Event('change', { bubbles: true }));
            filledCount++;
            filledFields.push({ element: field, fieldType, value });
            filledElementsSet.add(field);
            break;
          }
        }
        continue;
      }

      const success = setFieldValue(field, value);
      if (success) {
        filledCount++;
        filledFields.push({ element: field, fieldType, value });
        filledElementsSet.add(field);
      }
    }

    // 2. Custom Fields Fill with 5-Language Cross-Lingual Thesaurus Matrix
    if (Array.isArray(activeProfile.customFields)) {
      for (const customField of activeProfile.customFields) {
        if (!customField.label || !customField.value) continue;

        const searchKeywords = getSynonymKeywords(customField.label);

        for (const field of fields) {
          if (filledElementsSet.has(field)) continue;

          const signature = getFieldSignature(field);
          const isMatched = searchKeywords.some(kw => signature.includes(kw));

          if (isMatched) {
            const success = setFieldValue(field, customField.value);
            if (success) {
              filledCount++;
              filledFields.push({ element: field, fieldType: 'custom', value: customField.value });
              filledElementsSet.add(field);
            }
          }
        }
      }
    }

    showFillResult(filledCount, filledFields);
    return filledCount;
  }

  // ─── Visual Feedback (i18n Supported) ──────────────────────────────

  function showFillResult(count, filledFields) {
    const existing = document.getElementById('fastform-notification');
    if (existing) existing.remove();

    for (const { element } of filledFields) {
      element.classList.add('fastform-filled');
      setTimeout(() => {
        element.classList.remove('fastform-filled');
      }, 2000);
    }

    const toast = document.createElement('div');
    toast.id = 'fastform-notification';

    let successText = `Filled ${count} field(s) instantly ✨`;
    let warningText = `No matching fields detected on this page`;

    if (typeof chrome !== 'undefined' && chrome.i18n) {
      const msgSuccess = chrome.i18n.getMessage('toastSuccess', [count.toString()]);
      const msgWarning = chrome.i18n.getMessage('toastWarning');
      if (msgSuccess) successText = msgSuccess;
      if (msgWarning) warningText = msgWarning;
    }

    if (count > 0) {
      toast.innerHTML = `
        <div class="fastform-toast fastform-toast-success">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm5.707 7.293l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L8 12.172l6.293-6.293a1 1 0 111.414 1.414z" fill="#10B981"/>
          </svg>
          <span><strong>FastForm</strong> ${successText}</span>
        </div>
      `;
    } else {
      toast.innerHTML = `
        <div class="fastform-toast fastform-toast-warning">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm0 15a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm1-5a1 1 0 11-2 0V6a1 1 0 112 0v4z" fill="#F59E0B"/>
          </svg>
          <span><strong>FastForm</strong> ${warningText}</span>
        </div>
      `;
    }

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fastform-toast-hide');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ─── Message Listener ─────────────────────────────────────────────

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'fillForm' && message.profile) {
      const count = fillForm(message.profile);
      sendResponse({ success: true, filledCount: count });
    }
    return true;
  });

  window.addEventListener('message', (event) => {
    if (event.data?.type === 'FASTFORM_NOTIFY') {
      showFillResult(0, []);
    }
  });

})();
