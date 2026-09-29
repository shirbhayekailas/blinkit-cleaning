import React, { createContext, useContext, useState, useEffect } from 'react';

export const LANGUAGES = [
  { code: 'hi', label: 'हिंदी', flag: '🇮🇳', native: 'हिंदी' },
  { code: 'en', label: 'English', flag: '🇬🇧', native: 'English' },
  { code: 'hinglish', label: 'Hinglish', flag: '🇮🇳', native: 'Hinglish' }
];

const TRANSLATIONS = {
  // -------------------------------------------------------------
  // 1. HINDI (हिंदी - DEVNAGARI)
  // -------------------------------------------------------------
  hi: {
    // App header & brand
    app_title: 'ब्लिंकिट स्टोर डीप क्लीनिंग ट्रैकर',
    portal_badge: 'पोर्टल',
    vendor_badge: 'वेंडर ऑपरेशंस',

    // Roles
    role_admin: 'एडमिन',
    role_manager: 'मैनेजर',
    role_client: 'ब्लिंकिट क्लाइंट',
    role_supervisor: 'सुपरवाइजर',
    logout: 'लॉगआउट',
    switch_role: 'रोल बदलें / पुनः लॉगिन',
    login_title: 'ऑपरेशंस लॉगिन',
    login_subtitle: 'पोर्टल एक्सेस करने के लिए अपनी लॉगिन आईडी और पासवर्ड दर्ज करें',
    login_id_label: 'लॉगिन आईडी / मोबाइल नंबर',
    login_password_label: 'पासवर्ड / पिन',
    login_btn: 'पोर्टल में प्रवेश करें',
    login_verifying: 'सत्यापित हो रहा है...',

    // Top Navigation Tabs
    tab_cleanings: 'सफाई रिकॉर्ड',
    tab_stores: 'स्टोर लेजर',
    tab_schedules: 'शेड्यूल और कैलेंडर',
    tab_chemicals: 'केमिकल स्टॉक',
    tab_khata: 'सफाईकर्मी खाता',
    tab_issues: 'समस्याएं व दोष',
    tab_supervisors: 'सुपरवाइजर',
    tab_cleaners: 'सफाईकर्मी रोस्टर',
    tab_cloud_sync: 'क्लाउड सिंक',

    // Actions & Buttons
    btn_new_cleaning: '+ नई सफाई एंट्री',
    btn_new_store: '+ नया स्टोर जोड़ें',
    btn_export_excel: 'एक्सेल डाउनलोड',
    btn_backup: 'बैकअप / रीस्टोर',
    btn_morning_summary: 'सुबह की रिपोर्ट',
    btn_invoice: 'मासिक बिल / इनवॉइस',
    btn_night_route: 'नाइट रूट मैप',
    btn_install_app: 'ऐप इंस्टॉल करें',
    btn_save: 'सुरक्षित करें',
    btn_cancel: 'रद्द करें',
    btn_delete: 'हटाएं',
    btn_edit: 'संपादित करें',
    btn_close: 'बंद करें',

    // Search & Filter
    search_placeholder: 'स्टोर का नाम, कोड (BLK-...), शहर खोजें (Ctrl+K)...',
    filter_all: 'सभी रिकॉर्ड',
    filter_completed: 'पूर्ण सफाई',
    filter_in_progress: 'प्रगति पर',
    filter_pending: 'लंबित',
    filter_all_payments: 'सभी भुगतान स्थिति',
    filter_received: 'प्राप्त (Full Paid)',
    filter_partial: 'आंशिक (Partial Paid)',
    filter_pending_payment: 'बकाया (Unpaid)',

    // Daily Operations Pulse Bar
    pulse_title: 'दैनिक परिचालन सारांश (Live KPI)',
    pulse_total_stores: 'कुल सक्रिय स्टोर',
    pulse_cleanings_done: 'सफाई रिकॉर्ड',
    pulse_pending_dues: 'कुल बकाया राशि',
    pulse_open_issues: 'खुली समस्याएं',
    pulse_low_chemicals: 'कम केमिकल अलर्ट',
    pulse_today_schedule: 'आज का शेड्यूल',

    // Store Card
    card_clean_date: 'सफाई तिथि',
    card_timings: 'समय व अवधि',
    card_hours: 'घंटे',
    card_team: 'तैनात टीम',
    card_supervisor: 'सुपरवाइजर',
    card_cleaners: 'सफाईकर्मी',
    card_photos: 'सफाई फोटो प्रमाण',
    card_view_photos: 'सभी फोटो देखें',
    card_no_photos: 'फोटो उपलब्ध नहीं',
    card_scope: 'सफाई कार्य दायरा',
    card_chemicals_used: 'उपयोग किए गए केमिकल्स',
    card_rating: 'क्वालिटी स्कोर',
    card_amount: 'सफाई राशि',
    card_call: 'कॉल करें',
    card_whatsapp: 'व्हाट्सएप',
    card_certificate: 'FSSAI प्रमाण पत्र',
    card_share: 'शेयर रिपोर्ट',
    card_update_payment: 'भुगतान अपडेट',
    card_due_in: 'दिन शेष',
    card_overdue: 'दिन अतिदेय (OVERDUE)',

    // Cleaning Entry Modal
    entry_title_new: 'नई ब्लिंकिट डार्क स्टोर सफाई एंट्री',
    entry_title_edit: 'सफाई एंट्री संपादित करें',
    entry_sec1_title: '1. ब्लिंकिट डार्क स्टोर विवरण',
    entry_sec1_desc: 'स्टोर कोड डालते ही लेजर से सारी जानकारी स्वतः भर जाएगी',
    entry_store_code: 'स्टोर कोड *',
    entry_store_name: 'स्टोर का नाम *',
    entry_store_address: 'स्टोर का पता',
    entry_store_city: 'शहर (City)',
    entry_store_maps: 'गूगल मैप्स लोकेशन लिंक',
    entry_manager_name: 'स्टोर मैनेजर का नाम',
    entry_manager_phone: 'मैनेजर मोबाइल नंबर',
    entry_auto_fetched: 'लेजर से विवरण प्राप्त हुआ',

    entry_sec2_title: '2. सफाई तिथि, शिफ्ट और समय',
    entry_cleaning_date: 'सफाई तिथि *',
    entry_cycle_days: 'अगला सफाई चक्र',
    entry_shift: 'शिफ्ट',
    entry_start_time: 'शुरुआत समय',
    entry_end_time: 'समापन समय',

    entry_sec3_title: '3. वेंडर टीम और सफाईकर्मी स्टाफ',
    entry_vendor_agency: 'सर्विस वेंडर / एजेंसी',
    entry_supervisor_name: 'सुपरवाइजर का नाम *',
    entry_supervisor_phone: 'सुपरवाइजर फोन',
    entry_cleaner_dropdown: 'रजिस्टर्ड सफाईकर्मी ड्रॉपडाउन से चुनें:',
    entry_cleaner_chips: 'सफाईकर्मी रोस्टर (क्लिक करके चुनें / हटाएं):',
    entry_team_names: 'टीम सदस्यों के नाम (कॉमा से अलग करें) *',
    entry_headcount: 'कुल संख्या',

    entry_sec4_title: '4. सफाई शुल्क और भुगतान ट्रैकिंग (केवल एडमिन)',
    entry_total_amount: 'कुल सफाई राशि (₹) *',
    entry_amount_received: 'प्राप्त राशि (₹)',
    entry_amount_pending: 'बकाया राशि (₹)',
    entry_payment_status: 'भुगतान स्थिति',
    entry_payment_mode: 'भुगतान माध्यम',

    entry_sec_chemicals: '🧪 उपयोग किए गए केमिकल्स (स्टॉक से स्वतः कटेगा)',
    entry_chemicals_desc: 'इस सफाई में लगे केमिकल्स और मात्रा चुनें। सेव करने पर इन्वेंटरी से स्टॉक स्वतः माइनस हो जाएगा।',
    entry_std_chemical_pack: '⚡ 1-क्लिक स्टैंडर्ड 3-केमिकल पैक',
    entry_add_chemical_row: '+ केमिकल आइटम जोड़ें',
    entry_chemical_item: 'केमिकल उत्पाद',
    entry_qty_used: 'उपयोग मात्रा *',
    entry_unit: 'इकाई (Unit)',

    entry_sec_photos: 'सफाई फोटो प्रमाण (पहले / कार्य के दौरान / बाद)',
    entry_sec_scope: 'सफाई कार्य दायरा (Scope of Work)',
    entry_sec_machinery: 'मशीनरी और उपकरण चेकलिस्ट',
    entry_sec_signature: 'स्टोर मैनेजर डिजिटल हस्ताक्षर',
    entry_save_btn: 'सफाई रिकॉर्ड सेव करें',

    // Chemical Modal
    chem_modal_title: 'केमिकल स्टॉक एवं खपत ट्रैकर',
    chem_tab_balance: 'स्टॉक बैलेंस',
    chem_tab_action: 'स्टॉक घटाएं / जोड़ें',
    chem_tab_logs: 'खपत इतिहास',
    chem_btn_new: '+ नया केमिकल जोड़ें',
    chem_btn_load_std: 'स्टैंडर्ड कैटलॉग लोड करें (8 केमिकल्स)',

    // Cloud Status
    cloud_connected: 'सर्वर कनेक्टेड',
    cloud_live_sync: '5s लाइव सिंक',

    // Language Selector
    lang_change_title: 'भाषा बदलें (Select Language)',
    lang_current: 'हिंदी',

    // App Banner & Badges
    banner_client_title: 'ब्लिंकिट सिटी ऑपरेशंस और QA इंस्पेक्शन पोर्टल',
    banner_manager_title: 'ब्लिंकिट ऑपरेशंस मैनेजमेंट कंट्रोल सेंटर',
    banner_admin_title: 'ब्लिंकिट डार्क स्टोर डीप क्लीनिंग कंट्रोल सेंटर',
    badge_client: 'क्लाइंट / सिटी ऑप्स',
    badge_manager: 'ऑपरेशंस मैनेजर',
    badge_admin: 'वेंडर एडमिन',
    banner_client_desc: 'ऑफिशियल इंस्पेक्शन पोर्टल: पूर्ण स्टोर सफाई देखें, Before/After फोटो तुलना करें, और FSSAI हाइजीन सर्टिफिकेट डाउनलोड करें।',
    banner_manager_desc: 'ऑपरेशंस मैनेजर पोर्टल: डीप क्लीनिंग स्टोर विज़िट, शेड्यूल, नाइट रूट, केमिकल स्टॉक और सफाईकर्मी उपस्थिति प्रबंधित करें।',
    banner_admin_desc: 'स्टोर विज़िट ट्रैक करें, स्टोर लेजर मैनेज करें, पेंडिंग पेमेंट ट्रैक करें, P&L प्रॉफिट देखें और साइट सुपरवाइजर मैनेज करें।',

    // Records Section
    records_heading: 'स्टोर डीप क्लीनिंग रिकॉर्ड',
    store_singular: 'स्टोर',
    store_plural: 'स्टोर',
    btn_load_more: 'और स्टोर लोड करें',
    showing: 'दिखा रहे हैं',
    btn_show_all: 'सभी दिखाएं',
    btn_add_cleaning: 'स्टोर सफाई एंट्री जोड़ें',

    // Empty State
    empty_no_records: 'कोई स्टोर सफाई रिकॉर्ड नहीं मिला',
    empty_clear_filters: 'सर्च क्वेरी क्लियर करें या पेमेंट/स्टेटस फिल्टर रीसेट करें।',
    empty_start_first: 'अपनी पहली ब्लिंकिट डार्क स्टोर डीप क्लीनिंग एंट्री रिकॉर्ड करें।',

    // Idle Warning
    idle_alert_title: 'स्क्रीन निष्क्रियता अलर्ट',
    idle_alert_desc: 'सुरक्षा के लिए आपका सेशन',
    idle_alert_auto_logout: 'में ऑटो-लॉगआउट हो जाएगा।',
    idle_continue: 'मैं एक्टिव हूं (सेशन जारी रखें)',
    idle_logout_now: 'अभी लॉगआउट करें',
    alert_payment_admin_only: 'पेमेंट डिटेल्स एंटर या अपडेट करने का एक्सेस सिर्फ एडमिन के पास है।',

    // Footer
    footer_desc: 'फैसिलिटी मैनेजमेंट और डीप क्लीनिंग ऑपरेशंस',
    footer_cloud: '100% सर्वर क्लाउड डेटाबेस • रियल-टाइम मल्टी-डिवाइस सिंक'
  },

  // -------------------------------------------------------------
  // 2. ENGLISH (STANDARD)
  // -------------------------------------------------------------
  en: {
    // App header & brand
    app_title: 'Blinkit Store Deep Cleaning Tracker',
    portal_badge: 'PORTAL',
    vendor_badge: 'VENDOR OPS',

    // Roles
    role_admin: 'Admin',
    role_manager: 'Manager',
    role_client: 'Blinkit Client',
    role_supervisor: 'Supervisor',
    logout: 'Logout',
    switch_role: 'Switch Role / Re-login',
    login_title: 'Operations Sign In',
    login_subtitle: 'Enter your assigned Login ID & Password to access your portal',
    login_id_label: 'Login ID / Mobile Number',
    login_password_label: 'Password / PIN',
    login_btn: 'Sign In to Portal',
    login_verifying: 'Verifying Credentials...',

    // Top Navigation Tabs
    tab_cleanings: 'Store Visits',
    tab_stores: 'Store Ledger',
    tab_schedules: 'Cleaning Calendar',
    tab_chemicals: 'Chemical Stock',
    tab_khata: 'Cleaner Khata',
    tab_issues: 'Defects & Issues',
    tab_supervisors: 'Supervisors',
    tab_cleaners: 'Cleaners Roster',
    tab_cloud_sync: 'Cloud Sync',

    // Actions & Buttons
    btn_new_cleaning: '+ Log Cleaning',
    btn_new_store: '+ Add New Store',
    btn_export_excel: 'Export Excel',
    btn_backup: 'Backup & Restore',
    btn_morning_summary: 'Morning Summary',
    btn_invoice: 'Consolidated Invoice',
    btn_night_route: 'Night Routes',
    btn_install_app: 'Install App',
    btn_save: 'Save Changes',
    btn_cancel: 'Cancel',
    btn_delete: 'Delete',
    btn_edit: 'Edit',
    btn_close: 'Close',

    // Search & Filter
    search_placeholder: 'Search store name, code (BLK-...), city (Ctrl+K)...',
    filter_all: 'All Cleanings',
    filter_completed: 'Completed',
    filter_in_progress: 'In-Progress',
    filter_pending: 'Pending',
    filter_all_payments: 'All Payments',
    filter_received: 'Received (Full Paid)',
    filter_partial: 'Partial (Advance Paid)',
    filter_pending_payment: 'Pending (Unpaid)',

    // Daily Operations Pulse Bar
    pulse_title: 'Daily Operations Pulse (Live KPI)',
    pulse_total_stores: 'Total Stores',
    pulse_cleanings_done: 'Cleanings Done',
    pulse_pending_dues: 'Pending Dues',
    pulse_open_issues: 'Open Issues',
    pulse_low_chemicals: 'Low Stock Alerts',
    pulse_today_schedule: 'Scheduled Today',

    // Store Card
    card_clean_date: 'Clean Date',
    card_timings: 'Timings & Duration',
    card_hours: 'Hours',
    card_team: 'Team Deployed',
    card_supervisor: 'Supervisor',
    card_cleaners: 'Cleaners',
    card_photos: 'Cleaning Photos Proofs',
    card_view_photos: 'View All Photos',
    card_no_photos: 'No photos uploaded',
    card_scope: 'Vendor Scope of Work',
    card_chemicals_used: 'Chemicals Used',
    card_rating: 'Quality Rating',
    card_amount: 'Cleaning Amount',
    card_call: 'Call',
    card_whatsapp: 'WhatsApp',
    card_certificate: 'FSSAI Certificate',
    card_share: 'Share Report',
    card_update_payment: 'Update Payment',
    card_due_in: 'Due in',
    card_overdue: 'OVERDUE by',

    // Cleaning Entry Modal
    entry_title_new: 'New Blinkit Store Deep Cleaning Entry',
    entry_title_edit: 'Edit Deep Cleaning Entry',
    entry_sec1_title: '1. Blinkit Dark Store Details',
    entry_sec1_desc: 'Typing store code will automatically auto-fetch details from Ledger',
    entry_store_code: 'Store Code *',
    entry_store_name: 'Store Name *',
    entry_store_address: 'Store Address',
    entry_store_city: 'City / Hub',
    entry_store_maps: 'Google Maps Link',
    entry_manager_name: 'Store Manager Name',
    entry_manager_phone: 'Manager Phone',
    entry_auto_fetched: 'Auto-Fetched from Ledger',

    entry_sec2_title: '2. Cleaning Date, Shift & Timings',
    entry_cleaning_date: 'Cleaning Date *',
    entry_cycle_days: 'Next Cycle Days',
    entry_shift: 'Shift',
    entry_start_time: 'Start Time',
    entry_end_time: 'End Time',

    entry_sec3_title: '3. Vendor Team & Cleaners Roster',
    entry_vendor_agency: 'Vendor Agency',
    entry_supervisor_name: 'Supervisor Name *',
    entry_supervisor_phone: 'Supervisor Phone',
    entry_cleaner_dropdown: 'Select Registered Cleaner from Dropdown:',
    entry_cleaner_chips: 'Cleaners Roster (Click to toggle/remove):',
    entry_team_names: 'Team Members Names (Comma separated) *',
    entry_headcount: 'Headcount',

    entry_sec4_title: '4. Deep Cleaning Amount & Payment (Admin Only)',
    entry_total_amount: 'Total Amount (₹) *',
    entry_amount_received: 'Amount Received (₹)',
    entry_amount_pending: 'Amount Pending (₹)',
    entry_payment_status: 'Payment Status',
    entry_payment_mode: 'Payment Mode',

    entry_sec_chemicals: '🧪 Chemicals & Consumables Consumed (Auto Stock Deduction)',
    entry_chemicals_desc: 'Select chemicals used and enter consumption quantities. Stock is automatically deducted upon saving.',
    entry_std_chemical_pack: '⚡ 1-Click Standard 3-Chemical Pack',
    entry_add_chemical_row: '+ Add Chemical Row',
    entry_chemical_item: 'Chemical Product',
    entry_qty_used: 'Quantity Used *',
    entry_unit: 'Unit',

    entry_sec_photos: 'Cleaning Photos Proofs (Before / During / After)',
    entry_sec_scope: 'Vendor Scope of Work Executed',
    entry_sec_machinery: 'Machinery & Equipment Checklist',
    entry_sec_signature: 'Store Manager Digital Signature',
    entry_save_btn: 'Save Cleaning Record',

    // Chemical Modal
    chem_modal_title: 'Chemical Stock & Consumption Tracker',
    chem_tab_balance: 'Stock Balance',
    chem_tab_action: 'Issue / Add Stock',
    chem_tab_logs: 'Usage History',
    chem_btn_new: '+ Add New Chemical Product',
    chem_btn_load_std: 'Load Standard Catalog (8 Chemicals)',

    // Cloud Status
    cloud_connected: 'Server Connected',
    cloud_live_sync: '5s Live Sync',

    // Language Selector
    lang_change_title: 'Select Language',
    lang_current: 'English',

    // App Banner & Badges
    banner_client_title: 'Blinkit City Operations & QA Inspection Portal',
    banner_manager_title: 'Blinkit Operations Management Control Center',
    banner_admin_title: 'Blinkit Dark Store Deep Cleaning Control Center',
    badge_client: 'CLIENT / CITY OPS',
    badge_manager: 'OPERATIONS MANAGER',
    badge_admin: 'VENDOR ADMIN',
    banner_client_desc: 'Official inspection portal: View completed store cleanings, interactive Before/After photo comparisons, and download FSSAI Hygiene Certificates.',
    banner_manager_desc: 'Operations Manager Portal: Manage deep cleaning store visits, schedules, night routes, chemical stocks, and cleaner staff attendance.',
    banner_admin_desc: 'Track store visits, manage your Store Ledger, auto-fill store info, track pending payments, view P&L profits, and manage site supervisors.',

    // Records Section
    records_heading: 'Store Deep Cleaning Records',
    store_singular: 'store',
    store_plural: 'stores',
    btn_load_more: 'Load More Stores',
    showing: 'Showing',
    btn_show_all: 'Show All',
    btn_add_cleaning: 'Add Store Cleaning Entry',

    // Empty State
    empty_no_records: 'No matching store cleaning records found',
    empty_clear_filters: 'Try clearing your search query or reset the payment/status filters.',
    empty_start_first: 'Start by recording your first Blinkit dark store deep cleaning entry.',

    // Idle Warning
    idle_alert_title: 'Screen Inactivity Alert',
    idle_alert_desc: 'For security, your session will auto-logout in',
    idle_alert_auto_logout: 'seconds.',
    idle_continue: 'I\'m Active (Continue Session)',
    idle_logout_now: 'Logout Now',
    alert_payment_admin_only: 'Payment details can only be entered or updated by Admin users.',

    // Footer
    footer_desc: 'Facility Management & Deep Cleaning Operations',
    footer_cloud: '100% Server Cloud Database • Real-Time Multi-Device Sync'
  },

  // -------------------------------------------------------------
  // 3. HINGLISH (ROMAN SCRIPT HINDI - HIGHLY POPULAR AMONG GROUND STAFF)
  // -------------------------------------------------------------
  hinglish: {
    // App header & brand
    app_title: 'Blinkit Dark Store Deep Cleaning Tracker',
    portal_badge: 'PORTAL',
    vendor_badge: 'VENDOR OPS',

    // Roles
    role_admin: 'Admin',
    role_manager: 'Manager',
    role_client: 'Blinkit Client',
    role_supervisor: 'Supervisor',
    logout: 'Logout',
    switch_role: 'Role Switch Karein / Login',
    login_title: 'Operations Sign In',
    login_subtitle: 'Portal access karne ke liye apna Login ID aur Password dalein',
    login_id_label: 'Login ID / Mobile Number',
    login_password_label: 'Password / PIN',
    login_btn: 'Portal Me Login Karein',
    login_verifying: 'Verify Ho Raha Hai...',

    // Top Navigation Tabs
    tab_cleanings: 'Safai Records',
    tab_stores: 'Store Ledger',
    tab_schedules: 'Schedule & Calendar',
    tab_chemicals: 'Chemical Stock',
    tab_khata: 'Cleaner Khata',
    tab_issues: 'Defects & Issues',
    tab_supervisors: 'Supervisors',
    tab_cleaners: 'Cleaners Roster',
    tab_cloud_sync: 'Cloud Sync',

    // Actions & Buttons
    btn_new_cleaning: '+ Nayi Safai Entry',
    btn_new_store: '+ Naya Store Add Karein',
    btn_export_excel: 'Excel Download',
    btn_backup: 'Backup & Restore',
    btn_morning_summary: 'Subah Ki Summary',
    btn_invoice: 'Monthly Invoice / Bill',
    btn_night_route: 'Night Routes',
    btn_install_app: 'Install App',
    btn_save: 'Save Karein',
    btn_cancel: 'Cancel',
    btn_delete: 'Delete Karein',
    btn_edit: 'Edit Karein',
    btn_close: 'Close',

    // Search & Filter
    search_placeholder: 'Store name, code (BLK-...), city search karein (Ctrl+K)...',
    filter_all: 'Sabhi Records',
    filter_completed: 'Completed Safai',
    filter_in_progress: 'In-Progress (Chalu)',
    filter_pending: 'Pending',
    filter_all_payments: 'Sabhi Payment Status',
    filter_received: 'Mil Gaya (Full Paid)',
    filter_partial: 'Aadha Aaya (Partial)',
    filter_pending_payment: 'Baqaya (Pending)',

    // Daily Operations Pulse Bar
    pulse_title: 'Daily Operations Pulse (Live Summary)',
    pulse_total_stores: 'Total Stores',
    pulse_cleanings_done: 'Safai Ho Gayi',
    pulse_pending_dues: 'Baqaya Payment',
    pulse_open_issues: 'Open Issues',
    pulse_low_chemicals: 'Low Chemical Stock',
    pulse_today_schedule: 'Aaj Ka Schedule',

    // Store Card
    card_clean_date: 'Safai Ki Date',
    card_timings: 'Timings & Ghante',
    card_hours: 'Hours',
    card_team: 'Team Members',
    card_supervisor: 'Supervisor',
    card_cleaners: 'Cleaners',
    card_photos: 'Safai Photos Proofs',
    card_view_photos: 'Sabhi Photos Dekhein',
    card_no_photos: 'Photos attach nahi hain',
    card_scope: 'Kaam Ka Scope',
    card_chemicals_used: 'Chemicals Kharch Huye',
    card_rating: 'Audit Score',
    card_amount: 'Deep Cleaning Bill',
    card_call: 'Call Karein',
    card_whatsapp: 'WhatsApp',
    card_certificate: 'FSSAI Certificate',
    card_share: 'Report Bhejo',
    card_update_payment: 'Payment Update',
    card_due_in: 'Din Baki Hain',
    card_overdue: 'Din Late Hai (OVERDUE)',

    // Cleaning Entry Modal
    entry_title_new: 'Nayi Blinkit Store Deep Cleaning Entry',
    entry_title_edit: 'Safai Entry Edit Karein',
    entry_sec1_title: '1. Blinkit Dark Store Details',
    entry_sec1_desc: 'Store Code dalte hi ledger se sari details auto-fetch ho jayengi',
    entry_store_code: 'Store Code *',
    entry_store_name: 'Store Name *',
    entry_store_address: 'Store Ka Pata',
    entry_store_city: 'City / Hub',
    entry_store_maps: 'Google Maps Link',
    entry_manager_name: 'Store Manager Ka Naam',
    entry_manager_phone: 'Manager Phone Number',
    entry_auto_fetched: 'Ledger Se Auto-Fetch Ho Gaya',

    entry_sec2_title: '2. Safai Date, Shift & Timings',
    entry_cleaning_date: 'Cleaning Date *',
    entry_cycle_days: 'Agli Safai Cycle',
    entry_shift: 'Shift',
    entry_start_time: 'Start Time',
    entry_end_time: 'End Time',

    entry_sec3_title: '3. Vendor Team & Cleaners Staff',
    entry_vendor_agency: 'Service Vendor',
    entry_supervisor_name: 'Supervisor Ka Naam *',
    entry_supervisor_phone: 'Supervisor Phone',
    entry_cleaner_dropdown: 'Registered Cleaner Dropdown Se Select Karein:',
    entry_cleaner_chips: 'Cleaners Roster (Click karke select/remove karein):',
    entry_team_names: 'Sabke Naam (Team Members Names) *',
    entry_headcount: 'Total Headcount',

    entry_sec4_title: '4. Deep Cleaning Amount & Payment (Admin Only)',
    entry_total_amount: 'Total Safai Amount (₹) *',
    entry_amount_received: 'Mil Gaya Amount (₹)',
    entry_amount_pending: 'Baqaya Amount (₹)',
    entry_payment_status: 'Payment Status',
    entry_payment_mode: 'Payment Mode',

    entry_sec_chemicals: '🧪 Chemicals & Consumables Consumed (Stock Se Auto-Deduct)',
    entry_chemicals_desc: 'Is store cleaning me use huye chemicals aur quantity dalein. Save karne par inventory se stock auto-minus ho jayega.',
    entry_std_chemical_pack: '⚡ 1-Click Standard 3-Chemical Pack',
    entry_add_chemical_row: '+ Add Chemical Item',
    entry_chemical_item: 'Chemical Product',
    entry_qty_used: 'Kitna Use Huwa *',
    entry_unit: 'Unit',

    entry_sec_photos: 'Cleaning Photos Proofs (Before / During / After)',
    entry_sec_scope: 'Vendor Scope of Work Executed',
    entry_sec_machinery: 'Machinery & Equipment Checklist',
    entry_sec_signature: 'Store Manager Digital Signature',
    entry_save_btn: 'Safai Entry Save Karein',

    // Chemical Modal
    chem_modal_title: 'Chemical Stock & Consumption Tracker',
    chem_tab_balance: 'Stock Balance',
    chem_tab_action: 'Issue / Add Stock',
    chem_tab_logs: 'Kharch History',
    chem_btn_new: '+ Naya Chemical Add Karein',
    chem_btn_load_std: 'Standard Catalog Load Karein (8 Chemicals)',

    // Cloud Status
    cloud_connected: 'Server Connected',
    cloud_live_sync: '5s Live Sync',

    // Language Selector
    lang_change_title: 'Language Select Karein',
    lang_current: 'Hinglish',

    // App Banner & Badges
    banner_client_title: 'Blinkit City Operations & QA Inspection Portal',
    banner_manager_title: 'Blinkit Operations Management Control Center',
    banner_admin_title: 'Blinkit Dark Store Deep Cleaning Control Center',
    badge_client: 'CLIENT / CITY OPS',
    badge_manager: 'OPERATIONS MANAGER',
    badge_admin: 'VENDOR ADMIN',
    banner_client_desc: 'Official inspection portal: Completed store cleanings dekhein, Before/After photo comparisons, aur FSSAI Hygiene Certificates download karein.',
    banner_manager_desc: 'Operations Manager Portal: Deep cleaning store visits, schedules, night routes, chemical stocks aur cleaner staff attendance manage karein.',
    banner_admin_desc: 'Store visits track karein, Store Ledger manage karein, pending payments track karein, P&L profits dekhein aur site supervisors manage karein.',

    // Records Section
    records_heading: 'Store Deep Cleaning Records',
    store_singular: 'store',
    store_plural: 'stores',
    btn_load_more: 'Aur Stores Load Karein',
    showing: 'Dikha Rahe Hain',
    btn_show_all: 'Sabhi Dikhao',
    btn_add_cleaning: 'Store Safai Entry Add Karein',

    // Empty State
    empty_no_records: 'Koi matching store safai record nahi mila',
    empty_clear_filters: 'Search query clear karein ya payment/status filters reset karein.',
    empty_start_first: 'Apni pehli Blinkit dark store deep cleaning entry record karein.',

    // Idle Warning
    idle_alert_title: 'Screen Inactivity Alert',
    idle_alert_desc: 'Security ke liye aapka session',
    idle_alert_auto_logout: 'mein auto-logout ho jayega.',
    idle_continue: 'Main Active Hoon (Continue Session)',
    idle_logout_now: 'Abhi Logout Karein',
    alert_payment_admin_only: 'Payment details enter ya update karne ka access sirf Admin ke paas hai.',

    // Footer
    footer_desc: 'Facility Management & Deep Cleaning Operations',
    footer_cloud: '100% Server Cloud Database • Real-Time Multi-Device Sync'
  }
};

const LanguageContext = createContext({
  language: 'hi',
  setLanguage: () => {},
  t: (key, fallback) => fallback || key,
  languages: LANGUAGES
});

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem('app_language') || 'hi';
    } catch {
      return 'hi';
    }
  });

  const setLanguage = (newLang) => {
    if (TRANSLATIONS[newLang]) {
      setLanguageState(newLang);
      try {
        localStorage.setItem('app_language', newLang);
      } catch (e) {
        console.warn('Failed to save language in localStorage', e);
      }
    }
  };

  const t = (key, fallback = '') => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.hi;
    if (dict && dict[key]) {
      return dict[key];
    }
    // Fallback to English if not found in current language
    if (TRANSLATIONS.en && TRANSLATIONS.en[key]) {
      return TRANSLATIONS.en[key];
    }
    return fallback || key;
  };

  useEffect(() => {
    try {
      document.documentElement.lang = language === 'hi' ? 'hi' : 'en';
    } catch (e) {}
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'hi',
      setLanguage: () => {},
      t: (key, fallback) => fallback || key,
      languages: LANGUAGES
    };
  }
  return context;
}
