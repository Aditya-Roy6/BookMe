import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/react';
import {
  TicketRoundedIcon,
  StarRoundedIcon,
  FireRoundedIcon,
  CalendarRoundedIcon,
  MapPinRoundedIcon,
} from './CustomRoundedIcons';
import {
  ShieldCheck,
  FileText,
  Map,
  Lock,
  Globe,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Clock,
  Layers,
  Film,
  Music,
  User,
  Settings,
  X,
} from 'lucide-react';

export default function Footer() {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [sitemapOpen, setSitemapOpen] = useState(false);

  return (
    <>
      <footer className="bg-[#121212] border-t border-[#282828] text-[#b3b3b3] font-sans pt-14 pb-8 mt-auto relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Top Row: Brand & Live Engine Status */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-10 border-b border-[#222226]">
            <div className="lg:col-span-5 space-y-3.5">
              <Link to="/" className="flex items-center gap-2.5 group w-fit">
                <div className="w-9 h-9 rounded-full bg-[#1ed760] flex items-center justify-center text-black shadow-lg shadow-[#1ed760]/20 group-hover:scale-105 transition-transform">
                  <TicketRoundedIcon className="w-5 h-5 fill-black text-black" />
                </div>
                <span className="font-display font-black text-2xl tracking-tight text-white group-hover:text-[#1ed760] transition-colors">
                  BooK<span className="text-[#1ed760]">Me</span>
                </span>
              </Link>

              <p className="text-xs text-[#8c8c8e] max-w-md leading-relaxed">
                Next-generation cinema, concert arena & auditorium ticketing engine. Powered by distributed Redis atomic locks for instant QR pass issuance.
              </p>
            </div>

            {/* Quick Links 3-Column Navigation */}
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
              {/* Column 1: Experiences */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-[1.4px] text-white flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-[#1ed760]" />
                  <span>Experiences</span>
                </h4>
                <ul className="space-y-2 text-xs">
                  <li>
                    <Link to="/" className="hover:text-white transition-colors">
                      Now in Theatres (IMAX)
                    </Link>
                  </li>
                  <li>
                    <Link to="/" className="hover:text-white transition-colors">
                      Live Concert Tours
                    </Link>
                  </li>
                  <li>
                    <Link to="/" className="hover:text-white transition-colors">
                      Dolby Atmos 7.1 Shows
                    </Link>
                  </li>
                  <li>
                    <Link to="/my-bookings" className="hover:text-white transition-colors">
                      My Booking History
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 2: Organisers & Studios */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-[1.4px] text-white flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#1ed760]" />
                  <span>Studio & Venues</span>
                </h4>
                <ul className="space-y-2 text-xs">
                  <li>
                    <Link to="/organiser/dashboard" className="hover:text-white transition-colors">
                      Organiser Studio
                    </Link>
                  </li>
                  <li>
                    <Link to="/admin/venues" className="hover:text-white transition-colors">
                      CAD Floorplan Designer
                    </Link>
                  </li>
                  <li>
                    <Link to="/organiser/dashboard" className="hover:text-white transition-colors">
                      Live Box Office Analytics
                    </Link>
                  </li>
                  <li>
                    <Link to="/settings" className="hover:text-white transition-colors">
                      Account Preferences
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 3: Legal & Sitemap */}
              <div className="space-y-3 col-span-2 sm:col-span-1">
                <h4 className="text-xs font-black uppercase tracking-[1.4px] text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#1ed760]" />
                  <span>Legal & Sitemap</span>
                </h4>
                <ul className="space-y-2 text-xs">
                  <li>
                    <button
                      type="button"
                      onClick={() => setPrivacyOpen(true)}
                      className="hover:text-[#1ed760] transition-colors cursor-pointer text-left"
                    >
                      Privacy Policy
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => setTermsOpen(true)}
                      className="hover:text-[#1ed760] transition-colors cursor-pointer text-left"
                    >
                      Terms of Service
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => setSitemapOpen(true)}
                      className="hover:text-[#1ed760] transition-colors cursor-pointer text-left flex items-center gap-1"
                    >
                      <span>Platform Sitemap</span>
                      <Map className="w-3 h-3 text-[#1ed760]" />
                    </button>
                  </li>
                  <li>
                    <span className="text-[#666666]">GST (9% CGST + 9% SGST)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Compliance */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#666666] pt-2">
            <p>
              &copy; {new Date().getFullYear()} <strong className="text-[#888888]">BooKMe Entertainment Technologies Inc.</strong> All rights reserved.
            </p>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setPrivacyOpen(true)}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Privacy
              </button>
              <span>&bull;</span>
              <button
                type="button"
                onClick={() => setTermsOpen(true)}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Terms
              </button>
              <span>&bull;</span>
              <button
                type="button"
                onClick={() => setSitemapOpen(true)}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Sitemap
              </button>
              <span>&bull;</span>
              <span className="text-[#1ed760] font-bold">PCI-DSS Level 1 Encrypted</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── 1. PRIVACY POLICY MODAL ─── */}
      <Modal
        isOpen={privacyOpen}
        onOpenChange={setPrivacyOpen}
        backdrop="blur"
        size="2xl"
        scrollBehavior="inside"
        className="bg-[#181818] border border-[#282828] text-white rounded-2xl shadow-2xl"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="border-b border-[#282828] flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1ed760]/20 text-[#1ed760] flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-black text-white">Privacy Policy</h3>
                  <p className="text-xs text-[#b3b3b3]">BooKMe Data Protection & Security Guidelines</p>
                </div>
              </ModalHeader>

              <ModalBody className="py-6 space-y-5 text-xs text-[#b3b3b3] leading-relaxed">
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#1ed760]" />
                    <span>1. Information We Collect & Encryption</span>
                  </h4>
                  <p>
                    BooKMe collects customer identity details (name, verified email, and optional avatar preferences) solely to generate secure cryptographic ticket passes, dispatch real-time booking confirmation receipts, and manage time-limited seat hold queues. All sensitive data in transit is encrypted using industry-standard TLS 1.3 protocols.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#1ed760]" />
                    <span>2. Zero Card Data Retention (Razorpay Integration)</span>
                  </h4>
                  <p>
                    BooKMe never stores, processes, or retains your credit card numbers, debit card details, CVVs, or UPI PINs on our servers. All financial transactions are securely tokenized through Razorpay's certified PCI-DSS Level 1 payment gateway infrastructure.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#1ed760]" />
                    <span>3. Seat Hold & Real-Time Queue Privacy</span>
                  </h4>
                  <p>
                    During seat selection, temporary holds are maintained in our in-memory Redis cluster for a strict TTL window (10 minutes for checkout, 15 minutes for waitlist offers). Upon expiration or release, the lock keys are irrevocably deleted.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#1ed760]" />
                    <span>4. Third-Party Integrations</span>
                  </h4>
                  <p>
                    We interface with TMDB (The Movie Database) and Ticketmaster APIs exclusively to retrieve public theatrical release schedules, promotional posters, and venue metadata. No personal user data is ever transmitted to third-party media providers.
                  </p>
                </div>
              </ModalBody>

              <ModalFooter className="border-t border-[#282828] flex items-center justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-[#1ed760] text-black font-black text-xs uppercase tracking-wider rounded-full hover:scale-105 transition-transform cursor-pointer"
                >
                  I Understand
                </button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* ─── 2. TERMS OF SERVICE MODAL ─── */}
      <Modal
        isOpen={termsOpen}
        onOpenChange={setTermsOpen}
        backdrop="blur"
        size="2xl"
        scrollBehavior="inside"
        className="bg-[#181818] border border-[#282828] text-white rounded-2xl shadow-2xl"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="border-b border-[#282828] flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1ed760]/20 text-[#1ed760] flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-black text-white">Terms of Service</h3>
                  <p className="text-xs text-[#b3b3b3]">Ticketing Rules, Concurrency Guarantee & Cancellation Policy</p>
                </div>
              </ModalHeader>

              <ModalBody className="py-6 space-y-5 text-xs text-[#b3b3b3] leading-relaxed">
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#1ed760]" />
                    <span>1. Concurrency & Seat Guarantee</span>
                  </h4>
                  <p>
                    BooKMe guarantees that no seat can be double-booked. Once a seat status transitions to confirmed following successful payment verification, the seat is permanently locked to your booking reference.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#1ed760]" />
                    <span>2. Cancellation & 30-Minute Threshold</span>
                  </h4>
                  <p>
                    Reservations may be cancelled directly from your Booking History up to <strong>30 minutes prior to the scheduled showtime</strong>. Cancellations within 30 minutes of showtime commencement are strictly non-refundable due to theatre admission controls.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <TicketRoundedIcon className="w-4 h-4 fill-[#1ed760] text-[#1ed760]" />
                    <span>3. Admission & QR Code Verification</span>
                  </h4>
                  <p>
                    Each confirmed booking issues a unique encrypted high-recovery QR Pass containing your booking reference and movie thumbnail badge. You must present this QR code (via email pass or downloaded thermal receipt PDF) at auditorium entrance scanning gates.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#1ed760]" />
                    <span>4. Indian GST Billing & Tax Invoices</span>
                  </h4>
                  <p>
                    All ticket orders are subject to statutory GST regulations (9% CGST + 9% SGST for intra-state billing, or 18% IGST for inter-state billing). Itemized tax breakdown receipts are dispatched with every order confirmation email.
                  </p>
                </div>
              </ModalBody>

              <ModalFooter className="border-t border-[#282828] flex items-center justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-[#1ed760] text-black font-black text-xs uppercase tracking-wider rounded-full hover:scale-105 transition-transform cursor-pointer"
                >
                  Accept Terms
                </button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* ─── 3. SITEMAP MODAL ─── */}
      <Modal
        isOpen={sitemapOpen}
        onOpenChange={setSitemapOpen}
        backdrop="blur"
        size="3xl"
        scrollBehavior="inside"
        className="bg-[#181818] border border-[#282828] text-white rounded-2xl shadow-2xl"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="border-b border-[#282828] flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1ed760]/20 text-[#1ed760] flex items-center justify-center">
                  <Map className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-black text-white">Platform Sitemap</h3>
                  <p className="text-xs text-[#b3b3b3]">Comprehensive Navigation Index for BooKMe</p>
                </div>
              </ModalHeader>

              <ModalBody className="py-6 space-y-6 text-xs text-[#b3b3b3]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Category 1: Public Discovery */}
                  <div className="bg-[#121212] p-4 rounded-xl border border-white/5 space-y-3">
                    <h4 className="text-xs font-bold text-[#1ed760] uppercase tracking-wider flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5" />
                      <span>Auditorium Discovery</span>
                    </h4>
                    <ul className="space-y-2">
                      <li>
                        <Link
                          to="/"
                          onClick={onClose}
                          className="text-white hover:text-[#1ed760] flex items-center gap-1 transition-colors"
                        >
                          <ChevronRight className="w-3 h-3 text-[#1ed760]" />
                          <span>Movie Catalogue (Now in Theatres)</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/"
                          onClick={onClose}
                          className="text-white hover:text-[#1ed760] flex items-center gap-1 transition-colors"
                        >
                          <ChevronRight className="w-3 h-3 text-[#1ed760]" />
                          <span>Live Concerts & Festivals</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/"
                          onClick={onClose}
                          className="text-white hover:text-[#1ed760] flex items-center gap-1 transition-colors"
                        >
                          <ChevronRight className="w-3 h-3 text-[#1ed760]" />
                          <span>Interactive Spotlight Carousel</span>
                        </Link>
                      </li>
                    </ul>
                  </div>

                  {/* Category 2: Customer Account */}
                  <div className="bg-[#121212] p-4 rounded-xl border border-white/5 space-y-3">
                    <h4 className="text-xs font-bold text-[#1ed760] uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span>Customer Portals</span>
                    </h4>
                    <ul className="space-y-2">
                      <li>
                        <Link
                          to="/my-bookings"
                          onClick={onClose}
                          className="text-white hover:text-[#1ed760] flex items-center gap-1 transition-colors"
                        >
                          <ChevronRight className="w-3 h-3 text-[#1ed760]" />
                          <span>My Bookings & QR Passes</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/settings"
                          onClick={onClose}
                          className="text-white hover:text-[#1ed760] flex items-center gap-1 transition-colors"
                        >
                          <ChevronRight className="w-3 h-3 text-[#1ed760]" />
                          <span>Customer Preferences & Avatar</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/login"
                          onClick={onClose}
                          className="text-white hover:text-[#1ed760] flex items-center gap-1 transition-colors"
                        >
                          <ChevronRight className="w-3 h-3 text-[#1ed760]" />
                          <span>Sign In & Verification</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/register"
                          onClick={onClose}
                          className="text-white hover:text-[#1ed760] flex items-center gap-1 transition-colors"
                        >
                          <ChevronRight className="w-3 h-3 text-[#1ed760]" />
                          <span>Create New Account (OTP)</span>
                        </Link>
                      </li>
                    </ul>
                  </div>

                  {/* Category 3: Organiser & Admin Studio */}
                  <div className="bg-[#121212] p-4 rounded-xl border border-white/5 space-y-3">
                    <h4 className="text-xs font-bold text-[#1ed760] uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Organiser & Admin</span>
                    </h4>
                    <ul className="space-y-2">
                      <li>
                        <Link
                          to="/organiser/dashboard"
                          onClick={onClose}
                          className="text-white hover:text-[#1ed760] flex items-center gap-1 transition-colors"
                        >
                          <ChevronRight className="w-3 h-3 text-[#1ed760]" />
                          <span>Organiser Studio & Analytics</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/admin/venues"
                          onClick={onClose}
                          className="text-white hover:text-[#1ed760] flex items-center gap-1 transition-colors"
                        >
                          <ChevronRight className="w-3 h-3 text-[#1ed760]" />
                          <span>CAD Architectural Designer</span>
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </ModalBody>

              <ModalFooter className="border-t border-[#282828] flex items-center justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-[#1ed760] text-black font-black text-xs uppercase tracking-wider rounded-full hover:scale-105 transition-transform cursor-pointer"
                >
                  Close Sitemap
                </button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
