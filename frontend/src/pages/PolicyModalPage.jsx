import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';
import EventDiscovery from './EventDiscovery';
import {
  ShieldCheck,
  FileText,
  Lock,
  CheckCircle2,
  Clock,
  Globe,
  Sparkles,
  Ticket as TicketRoundedIcon,
} from '../components/MappedIcons';

export default function PolicyModalPage({ type = 'privacy' }) {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();

  const handleClose = () => {
    setIsOpen(false);
    navigate('/', { replace: true });
  };

  return (
    <div className="relative min-h-screen">
      {/* Background Page Content */}
      <div className="filter blur-sm pointer-events-none opacity-40">
        <EventDiscovery />
      </div>

      {/* ─── PRIVACY POLICY POPUP ─── */}
      {type === 'privacy' && (
        <Modal
          isOpen={isOpen}
          onOpenChange={(open) => {
            if (!open) handleClose();
            else setIsOpen(true);
          }}
          backdrop="blur"
          size="2xl"
          scrollBehavior="inside"
          className="bg-[#181818] border border-[#282828] text-white rounded-2xl shadow-2xl"
        >
          <ModalContent>
            {() => (
              <>
                <ModalHeader className="border-b border-[#282828] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1ed760] text-black shadow-lg shadow-[#1ed760]/20 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-5 h-5 text-black fill-black" />
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
                    onClick={handleClose}
                    className="px-6 py-2 bg-[#1ed760] text-black font-black text-xs uppercase tracking-wider rounded-full hover:scale-105 transition-transform cursor-pointer"
                  >
                    I Understand
                  </button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      )}

      {/* ─── TERMS OF SERVICE (TOC) POPUP ─── */}
      {type === 'toc' && (
        <Modal
          isOpen={isOpen}
          onOpenChange={(open) => {
            if (!open) handleClose();
            else setIsOpen(true);
          }}
          backdrop="blur"
          size="2xl"
          scrollBehavior="inside"
          className="bg-[#181818] border border-[#282828] text-white rounded-2xl shadow-2xl"
        >
          <ModalContent>
            {() => (
              <>
                <ModalHeader className="border-b border-[#282828] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1ed760] text-black shadow-lg shadow-[#1ed760]/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-black fill-black" />
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
                    onClick={handleClose}
                    className="px-6 py-2 bg-[#1ed760] text-black font-black text-xs uppercase tracking-wider rounded-full hover:scale-105 transition-transform cursor-pointer"
                  >
                    Accept Terms
                  </button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}
