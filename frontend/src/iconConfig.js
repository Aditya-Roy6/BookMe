/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BOOKME — 100% COMPLETE MASTER ICON CONFIGURATION MAPPING
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Instructions:
 * 1. To map an icon to a custom SVG in `frontend/public/`, set its value
 *    to the filename (e.g., 'ticket-sale-svgrepo-com.svg').
 * 2. To use the default Lucide SVG icon, leave its value as `null` or `''`.
 * 3. Whenever you modify this file, it will automatically recompile in dev mode,
 *    or you can manually run: `node scripts/build_icons.js`
 * 
 * 100% of all icons used across the entire website are defined below!
 */

export const ICON_MAP = {

  // ═══════════════════════════════════════════════════════════════════════
  // 🧭 SECTION 1: NAVIGATION & HEADER (Navbar.jsx, Footer.jsx)
  // ═══════════════════════════════════════════════════════════════════════
  LayoutDashboard: 'dashboard-svgrepo-com (1).svg',   // Top Navbar "Dashboard" button
  LogOut: 'logout-svgrepo-com.svg',                    // User dropdown "Log Out" action
  Settings: 'settings-svgrepo-com.svg',                // User dropdown "Settings" & Footer settings link
  Sun: 'sun-svgrepo-com.svg',                          // Theme toggle: Sun icon (shown when Dark Mode is active)
  Moon: 'moon-svgrepo-com.svg',                        // Theme toggle: Moon icon (shown when Light Mode is active)
  Menu:'hamburger-menu-svgrepo-com.svg',                                          // Mobile navigation hamburger toggle
  X: 'cross-svgrepo-com.svg',                                             // Modal close buttons, search clear, filter reset

  // ═══════════════════════════════════════════════════════════════════════
  // 🔍 SECTION 2: SEARCH, DISCOVERY & FILTERS (EventDiscovery.jsx, BookingHistory.jsx)
  // ═══════════════════════════════════════════════════════════════════════
  Search: 'search-alt-2-svgrepo-com.svg',              // Main search inputs (Navbar, Discovery, Booking history, Organiser)
  Filter: 'filter-svgrepo-com.svg',                    // Filter modal & filter dropdown buttons
  SlidersHorizontal: 'sliders-1-svgrepo-com.svg',      // Discovery filter panel toggle & date range options
  Sliders: 'sliders-1-svgrepo-com.svg',                // Seat layout settings & audio equalizer slider
  Flame: 'fire-svgrepo-com.svg',                       // "Trending Now" hot badge & genre highlight
  Star: 'star-svgrepo-com.svg',                        // Movie ratings, critic scores & star badges
  Globe:'globe-alt-svgrepo-com.svg',                                         // Language selector & international currency badge
  Globe2:'globe-alt-svgrepo-com.svg',                                        // "All Regions / Global" discovery filter chip
  Play: 'play-svgrepo-com.svg',                        // "Watch Trailer" button & video player trigger

  // ═══════════════════════════════════════════════════════════════════════
  // 🎬 SECTION 3: EVENT DETAILS & MEDIA (EventDetail.jsx, SeatSelection.jsx)
  // ═══════════════════════════════════════════════════════════════════════
  Film: 'movie-film-roll-for-movie-svgrepo-com.svg',   // Format badges (IMAX, 3D, 4DX, 2D) & movie listings
  Volume2: 'speaker-wave-1-svgrepo-com.svg',           // Dolby Atmos, audio channels & language indicators
  Info: 'info-circle-svgrepo-com.svg',                 // Tooltips, booking terms & event synopsis details
  Compass: 'compass-square-svgrepo-com.svg',           // "Explore Nearby Venues" & navigation aid
  Navigation:'paper-plane-toy-svgrepo-com.svg',                                    // Directions to theatre & map route launcher
  MessageSquare: 'message-text-svgrepo-com.svg',                                 // Audience reviews, comments & ratings section
  TrendingUp:'trending-up-svgrepo-com--1-.svg',           // High demand badge, trending indicators & analytics growth

  // ═══════════════════════════════════════════════════════════════════════
  // 🎟️ SECTION 4: TICKETING, BOOKING & CHECKOUT (BookingHistory.jsx, Checkout.jsx, SeatSelection.jsx)
  // ═══════════════════════════════════════════════════════════════════════
  Ticket: 'ticket-sale-svgrepo-com.svg',               // Universal ticket icon (pass, booking card, logo badge)
  Calendar: 'calender-svgrepo-com.svg',                // Showtime date selector & booking calendar
  Clock:'clock-svgrepo-com.svg',               // Showtime time chips, session duration & countdown timers
  MapPin: 'location-svgrepo-com.svg',                  // Theatre venue address & cinema location pins
  Map: 'map-svgrepo-com.svg',                          // Interactive map & venue layout overview
  DollarSign: 'dollar-circle-svgrepo-com.svg',         // Ticket pricing, grand total & revenue stats
  CreditCard: 'credit-card-svgrepo-com.svg',           // Payment card input, Razorpay & checkout methods
  Lock: 'lock-keyhole-svgrepo-com.svg',                // SSL security badge, encryption note & password inputs
  QrCode:'qrcode-svgrepo-com.svg',                                        // Digital ticket QR code pass & entrance scanner
  Download: 'download-square-svgrepo-com.svg',         // Download PDF ticket pass & invoice receipt
  Armchair:'chair-2-svgrepo-com (1).svg',                                      // Seat map legend: Standard seat indicator

  // ═══════════════════════════════════════════════════════════════════════
  // 📊 SECTION 5: ORGANISER STUDIO & ANALYTICS (OrganiserDashboard.jsx)
  // ═══════════════════════════════════════════════════════════════════════
  BarChart3: 'chart-bar-alt-square-svgrepo-com.svg',   // Revenue metrics chart & performance analytics card
  PieChart: 'pie-chart-2-svgrepo-com.svg',             // Ticket tier distribution & occupancy breakdown
  Percent: 'percent-circle-svgrepo-com.svg',           // Hall occupancy rate & seat fill percentage
  Activity: 'graph-svgrepo-com.svg',                   // Live real-time booking stream & activity monitor
  ArrowUpRight:'arrow-up-right-square-svgrepo-com.svg',                                  // Positive growth stat arrow & external dashboard link
  Layers: 'layers-svgrepo-com.svg',                    // Tier layers, venue categories & studio sections
  Edit3: 'pencil-svgrepo-com.svg',                     // Edit showtime timings, pricing & event listings
  Users:'users-svgrepo-com.svg',                                         // Total attendees, customer count & audience analytics
  Plus:'plus-square-svgrepo-com.svg',                                          // "Create New Event" & "Add Showtime" modal triggers
  Music:'music-library-svgrepo-com.svg',                                         // Concerts, musical events & live gigs category

  // ═══════════════════════════════════════════════════════════════════════
  // 🏟️ SECTION 6: ADMIN VENUE DESIGNER & SEAT BUILDER (AdminVenues.jsx)
  // ═══════════════════════════════════════════════════════════════════════
  Save: 'save-svgrepo-com.svg',                        // Save venue grid, publish layout & store settings
  Trash2:'trash-bin-trash-svgrepo-com.svg',                                        // Delete venue, remove row & wipe tier category
  Eye: 'eye-svgrepo-com.svg',                          // Preview seat map & reveal password toggle
  EyeOff: 'eye-off-svgrepo-com.svg',                   // Hide password & exit canvas preview
  Grid:'grid-1526-svgrepo-com.svg',                        // Snap-to-grid toggle in interactive seat designer
  LayoutGrid: 'apps-svgrepo-com.svg',                  // Grid view toggle in booking history & venue manager
  Tv:'tv-svgrepo-com.svg',                                            // Cinema screen / stage placement indicator
  Disc:'disc-svgrepo-com.svg',                                          // Circular table / VIP booth seat geometry tool
  Maximize2:'maximize-square-minimalistic-svgrepo-com.svg',                                     // Fullscreen canvas mode for large stadium designs
  MousePointer:'mouse-pointer-svgrepo-com.svg',                                  // Pointer selection tool & multi-seat drag selector
  RotateCw:'reload-circular-arrow-svgrepo-com.svg',                                      // Rotate stage / refresh captcha & reset showtimes
  Minus:'minus-square-svgrepo-com.svg',                                         // Zoom out / decrease row count button
  ZoomIn:'zoom-in-svgrepo-com.svg',                                        // Zoom in on seat canvas
  ZoomOut:'magnifying-glass-minus-fill-svgrepo-com.svg',                                       // Zoom out on seat canvas
  Type:'text-square-svgrepo-com.svg',                                          // Add text label / aisle title tool
  Square:'square-svgrepo-com.svg',                                        // Standard square seat shape tool
  Slash:'slash-square-svgrepo-com.svg',                                         // Seat gap / aisle divider tool
  PenTool:'pen-svgrepo-com.svg',                                       // Custom polygon / curved tier drawing tool
  CornerUpLeft: null,                                  // Undo canvas edit action
  CornerUpRight: null,                                 // Redo canvas edit action
  Move:'move-svgrepo-com.svg',                                          // Pan canvas & drag section tool
  Wand2:'magic-stick-3-svgrepo-com.svg',                                         // AI auto-generate seats magic wand
  Copy: 'copy-svgrepo-com.svg',                        // Duplicate selected row / copy seat pattern
  Hash:'hashtag-square-svgrepo-com.svg',                                          // Auto-number seats tool (A1, A2, A3...)

  // ═══════════════════════════════════════════════════════════════════════
  // 🏆 SECTION 7: SPORTS, ARENAS & SPECIAL VENUES (SportsVenueLayouts.jsx)
  // ═══════════════════════════════════════════════════════════════════════
  Trophy: 'trophy-svgrepo-com.svg',                    // Tournament & championship sports arena layout
  Shield: 'shield-minimalistic-svgrepo-com.svg',       // VIP security badge & team defense arena zone
  Flag:'flag-svgrepo-com.svg',                                          // Race track / motorsport grandstand layout
  Swords:'swords-sword-svgrepo-com.svg',                                        // Boxing ring & MMA combat arena layout
  Mic:'mic-svgrepo-com.svg',                                           // Comedy club & podcast live recording layout
  CinemaIcon: 'cinema-film-movies-add-svgrepo-com.svg', // Multiplex cinema hall template
  StadiumIcon: 'stadium-svgrepo-com.svg',              // Open-air sports stadium template
  TheatreIcon: 'drama-masks-svgrepo-com.svg',          // Broadway & opera house tier template

  // ═══════════════════════════════════════════════════════════════════════
  // 🔐 SECTION 8: AUTHENTICATION, ACCOUNTS & OTP (Login, Register, ResetPassword)
  // ═══════════════════════════════════════════════════════════════════════
  Mail: 'mail-pencil-svgrepo-com.svg',                 // Email address input icon & inbox alerts
  KeyRound:'key-minimalistic-svgrepo-com.svg',                                      // 6-digit OTP verification code input
  User:'user-svgrepo-com.svg',                                          // Profile avatar placeholder & user account tab
  UserCheck:'user-check-svgrepo-com.svg',                                     // Verified customer badge & account active state
  Building2:'building-4-svgrepo-com.svg',                                     // Organiser company & theatre chain registration

  // ═══════════════════════════════════════════════════════════════════════
  // 👤 SECTION 9: USER SETTINGS & PREFERENCES (CustomerSettings.jsx)
  // ═══════════════════════════════════════════════════════════════════════
  Camera: 'camera-svgrepo-com.svg',                    // Profile photo upload & avatar camera overlay
  Upload: 'upload-square-svgrepo-com.svg',             // Upload poster banner & identity verification document
  Bell: 'bell-svgrepo-com.svg',                        // Push notification & email reminder preferences

  // ═══════════════════════════════════════════════════════════════════════
  // 🔔 SECTION 10: ALERTS, STATUS & TOASTS (ToastContext.jsx, TTLTimer.jsx)
  // ═══════════════════════════════════════════════════════════════════════
  AlertCircle: 'alert-circle-svgrepo-com.svg',         // Error toast notifications & form validation errors
  AlertTriangle: 'alert-triangle-svgrepo-com.svg',     // Warning toast & 10-minute seat hold expiring countdown
  CheckCircle2:'tick-circle-svgrepo-com.svg',                                  // Booking confirmed green check & payment success
  ShieldCheck: 'shield-minimalistic-svgrepo-com.svg',  // Verified badge (Footer security, SSL verification)

  // ═══════════════════════════════════════════════════════════════════════
  // 🧩 SECTION 11: COMMON UI UTILITIES & BUTTONS (Select, DateTimePicker, Calendar)
  // ═══════════════════════════════════════════════════════════════════════
  Check:'check-square-svgrepo-com.svg',                                         // Selected item checkmark in dropdowns & color picker
  ChevronLeft:'arrow-left-square-svgrepo-com.svg',                                   // Previous month button & pagination back
  ChevronRight:'arrow-right-square-svgrepo-com.svg',                                  // Next month button & pagination next
  ChevronDown:'arrow-down-square-svgrepo-com.svg',                                   // Dropdown arrow & collapsible accordion indicator
  ChevronUp:'arrow-up-square-svgrepo-com.svg',                                     // Collapse accordion toggle
  ArrowRight:'arrow-right-svgrepo-com.svg',                                    // "Proceed to Checkout", "Next Step" & submit buttons
  ArrowLeft:'arrow-left-svgrepo-com.svg',                                     // "Back to Seat Selection" & return buttons
  Loader2:'loader-circle-svgrepo-com.svg',                                       // Async loading spinner indicator
  Sparkles:'star-svgrepo-com--1-.svg',                                      // AI features & premium experience highlights
  ExternalLink: 'link-alt-1-svgrepo-com.svg',          // External links (social media, maps, terms)
  FileText:'document-text-svgrepo-com.svg',                                      // Privacy policy & terms of service document icon
  HelpCircle:'question-mark-outline-svgrepo-com.svg',                                    // FAQ modal & customer support help icon
};
