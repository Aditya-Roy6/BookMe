import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Chip,
  Divider,
} from '@heroui/react';
import api from '../api/client';
import TTLTimer from '../components/TTLTimer';
import { CheckCircle2, AlertCircle, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { Ticket, Clock, Calendar, MapPin } from '../components/MappedIcons';

export default function WaitlistOfferClaim() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [offerData, setOfferData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchOffer() {
      try {
        const res = await api.get(`/waitlist/offer/${token}`);
        setOfferData(res.data.offer);
      } catch (err) {
        setError(err.response?.data?.error || 'This offer link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    }
    fetchOffer();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-white/50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Verifying your time-limited offer token...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-16">
        <Card className="bg-[#141418]/90 border border-white/10 p-8 text-center space-y-4">
          <CardBody className="gap-3 items-center">
            <AlertCircle className="w-12 h-12 text-danger" />
            <h2 className="text-xl font-bold text-white">Offer Expired or Invalid</h2>
            <p className="text-xs text-white/60">{error}</p>
            <Button as={Link} to="/" color="primary" size="sm" className="font-semibold rounded-xl mt-2">
              Return to Events
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const showtime = offerData?.showtime;
  const event = showtime?.event;
  const category = offerData?.category;

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <Card className="bg-[#141418]/90 border border-white/10 p-6 sm:p-8 text-center space-y-6 shadow-2xl">
        <CardBody className="p-0 space-y-6 items-center">
          <div className="w-16 h-16 rounded-full bg-success/20 border border-success/30 flex items-center justify-center text-success mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>

          <div className="space-y-1 text-center">
            <Chip size="sm" color="success" variant="flat" className="font-semibold uppercase text-[10px]">
              EXCLUSIVE WAITLIST OFFER
            </Chip>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-white">
              A Seat Is Reserved For You!
            </h1>
            <p className="text-xs text-white/60">
              A previously booked seat just became available for <strong>{event?.title}</strong>.
            </p>
          </div>

          {/* Expiry Pill */}
          <div className="flex justify-center">
            <TTLTimer
              expiresAt={offerData?.offerExpiresAt}
              onExpire={() => setError('Your time-limited offer has expired.')}
            />
          </div>

          {/* Offer Summary */}
          <Card className="bg-white/5 border border-white/10 p-4 text-left w-full text-xs">
            <CardBody className="p-0 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-white/40 uppercase font-semibold">Category:</span>
                <span className="font-semibold text-white">{category?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40 uppercase font-semibold">Venue:</span>
                <span className="text-white">{event?.venue?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40 uppercase font-semibold">Showtime:</span>
                <span className="font-mono text-white">
                  {showtime?.dateTime ? new Date(showtime.dateTime).toLocaleString() : ''}
                </span>
              </div>
            </CardBody>
          </Card>

          <Button
            color="primary"
            size="lg"
            fullWidth
            className="font-bold text-sm rounded-2xl shadow-xl"
            endContent={<ArrowRight className="w-4 h-4" />}
            onPress={() => navigate(`/showtime/${offerData?.showtimeId}/seats`)}
          >
            Claim Seat & Complete Order
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
