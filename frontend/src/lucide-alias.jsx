import React from 'react';

const IconBase = ({ src, size = 24, className = '', color = 'currentColor', rotate = 0, ...props }) => {
  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        backgroundColor: color,
        maskImage: `url('/${src}')`,
        WebkitMaskImage: `url('/${src}')`,
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        flexShrink: 0,
        ...props.style
      }}
      {...props}
    />
  );
};

export const Activity = (props) => <IconBase src="graph-svgrepo-com.svg" {...props} />;
export const AlertCircle = (props) => <IconBase src="info-circle-svgrepo-com.svg" {...props} />;
export const AlertTriangle = (props) => <IconBase src="info-circle-svgrepo-com.svg" {...props} />;
export const Armchair = (props) => <IconBase src="normal seats.svg" {...props} />;
export const ArrowLeft = (props) => <IconBase src="play-svgrepo-com.svg" rotate={180} {...props} />;
export const ArrowRight = (props) => <IconBase src="play-svgrepo-com.svg" {...props} />;
export const ArrowUpRight = (props) => <IconBase src="play-svgrepo-com.svg" rotate={-45} {...props} />;
export const BarChart3 = (props) => <IconBase src="chart-bar-alt-square-svgrepo-com.svg" {...props} />;
export const Bell = (props) => <IconBase src="bell-svgrepo-com.svg" {...props} />;
export const Building2 = (props) => <IconBase src="stadium-svgrepo-com.svg" {...props} />;
export const Calendar = (props) => <IconBase src="calender-svgrepo-com.svg" {...props} />;
export const Camera = (props) => <IconBase src="cinema-film-movies-add-svgrepo-com.svg" {...props} />;
export const Check = (props) => <IconBase src="star-svgrepo-com.svg" {...props} />;
export const CheckCircle2 = (props) => <IconBase src="star-svgrepo-com.svg" {...props} />;
export const ChevronDown = (props) => <IconBase src="play-svgrepo-com.svg" rotate={90} {...props} />;
export const ChevronLeft = (props) => <IconBase src="play-svgrepo-com.svg" rotate={180} {...props} />;
export const ChevronRight = (props) => <IconBase src="play-svgrepo-com.svg" {...props} />;
export const Clock = (props) => <IconBase src="clock-circle-svgrepo-com.svg" {...props} />;
export const Compass = (props) => <IconBase src="location-svgrepo-com.svg" {...props} />;
export const Copy = (props) => <IconBase src="save-svgrepo-com.svg" {...props} />;
export const CornerUpLeft = (props) => <IconBase src="play-svgrepo-com.svg" rotate={-135} {...props} />;
export const CornerUpRight = (props) => <IconBase src="play-svgrepo-com.svg" rotate={-45} {...props} />;
export const CreditCard = (props) => <IconBase src="dollar-circle-svgrepo-com.svg" {...props} />;
export const Disc = (props) => <IconBase src="movie-film-roll-for-movie-svgrepo-com.svg" {...props} />;
export const DollarSign = (props) => <IconBase src="dollar-circle-svgrepo-com.svg" {...props} />;
export const Download = (props) => <IconBase src="save-svgrepo-com.svg" {...props} />;
export const Edit3 = (props) => <IconBase src="settings-svgrepo-com.svg" {...props} />;
export const ExternalLink = (props) => <IconBase src="play-svgrepo-com.svg" rotate={-45} {...props} />;
export const Eye = (props) => <IconBase src="search-alt-2-svgrepo-com.svg" {...props} />;
export const EyeOff = (props) => <IconBase src="search-alt-2-svgrepo-com.svg" {...props} />;
export const FileText = (props) => <IconBase src="event-calender-date-note-svgrepo-com.svg" {...props} />;
export const Film = (props) => <IconBase src="movie-film-roll-for-movie-svgrepo-com.svg" {...props} />;
export const Filter = (props) => <IconBase src="filter-svgrepo-com.svg" {...props} />;
export const Flag = (props) => <IconBase src="location-svgrepo-com.svg" {...props} />;
export const Flame = (props) => <IconBase src="fire-svgrepo-com.svg" {...props} />;
export const Globe = (props) => <IconBase src="stadium-svgrepo-com.svg" {...props} />;
export const Globe2 = (props) => <IconBase src="stadium-svgrepo-com.svg" {...props} />;
export const Grid = (props) => <IconBase src="apps-svgrepo-com.svg" {...props} />;
export const Hash = (props) => <IconBase src="info-circle-svgrepo-com.svg" {...props} />;
export const HelpCircle = (props) => <IconBase src="info-circle-svgrepo-com.svg" {...props} />;
export const Info = (props) => <IconBase src="info-circle-svgrepo-com.svg" {...props} />;
export const KeyRound = (props) => <IconBase src="settings-svgrepo-com.svg" {...props} />;
export const Layers = (props) => <IconBase src="apps-svgrepo-com.svg" {...props} />;
export const LayoutDashboard = (props) => <IconBase src="dashboard-svgrepo-com (1).svg" {...props} />;
export const LayoutGrid = (props) => <IconBase src="apps-svgrepo-com.svg" {...props} />;
export const Loader2 = (props) => <IconBase src="clock-circle-svgrepo-com.svg" {...props} />;
export const Lock = (props) => <IconBase src="settings-svgrepo-com.svg" {...props} />;
export const LogOut = (props) => <IconBase src="logout-svgrepo-com.svg" {...props} />;
export const Mail = (props) => <IconBase src="event-calender-date-note-svgrepo-com.svg" {...props} />;
export const Map = (props) => <IconBase src="location-svgrepo-com.svg" {...props} />;
export const MapPin = (props) => <IconBase src="location-svgrepo-com.svg" {...props} />;
export const Maximize2 = (props) => <IconBase src="apps-svgrepo-com.svg" {...props} />;
export const Menu = (props) => <IconBase src="apps-svgrepo-com.svg" {...props} />;
export const MessageSquare = (props) => <IconBase src="info-circle-svgrepo-com.svg" {...props} />;
export const Mic = (props) => <IconBase src="speaker-wave-1-svgrepo-com.svg" {...props} />;
export const Minus = (props) => <IconBase src="info-circle-svgrepo-com.svg" {...props} />;
export const MousePointer = (props) => <IconBase src="play-svgrepo-com.svg" {...props} />;
export const Move = (props) => <IconBase src="apps-svgrepo-com.svg" {...props} />;
export const Music = (props) => <IconBase src="speaker-wave-1-svgrepo-com.svg" {...props} />;
export const Navigation = (props) => <IconBase src="location-svgrepo-com.svg" {...props} />;
export const PenTool = (props) => <IconBase src="settings-svgrepo-com.svg" {...props} />;
export const Percent = (props) => <IconBase src="percent-circle-svgrepo-com.svg" {...props} />;
export const PieChart = (props) => <IconBase src="pie-chart-2-svgrepo-com.svg" {...props} />;
export const Play = (props) => <IconBase src="play-svgrepo-com.svg" {...props} />;
export const Plus = (props) => <IconBase src="apps-svgrepo-com.svg" {...props} />;
export const QrCode = (props) => <IconBase src="apps-svgrepo-com.svg" {...props} />;
export const RotateCw = (props) => <IconBase src="clock-circle-svgrepo-com.svg" {...props} />;
export const Save = (props) => <IconBase src="save-svgrepo-com.svg" {...props} />;
export const Search = (props) => <IconBase src="search-alt-2-svgrepo-com.svg" {...props} />;
export const Settings = (props) => <IconBase src="settings-svgrepo-com.svg" {...props} />;
export const Shield = (props) => <IconBase src="info-circle-svgrepo-com.svg" {...props} />;
export const ShieldCheck = (props) => <IconBase src="info-circle-svgrepo-com.svg" {...props} />;
export const Slash = (props) => <IconBase src="info-circle-svgrepo-com.svg" {...props} />;
export const Sliders = (props) => <IconBase src="filter-svgrepo-com.svg" {...props} />;
export const SlidersHorizontal = (props) => <IconBase src="filter-svgrepo-com.svg" {...props} />;
export const Sparkles = (props) => <IconBase src="star-svgrepo-com.svg" {...props} />;
export const Square = (props) => <IconBase src="apps-svgrepo-com.svg" {...props} />;
export const Star = (props) => <IconBase src="star-svgrepo-com.svg" {...props} />;
export const Sun = (props) => <IconBase src="sun-svgrepo-com.svg" {...props} />;
export const Swords = (props) => <IconBase src="drama-masks-svgrepo-com.svg" {...props} />;
export const Ticket = (props) => <IconBase src="ticket-sale-svgrepo-com.svg" {...props} />;
export const Trash2 = (props) => <IconBase src="logout-svgrepo-com.svg" {...props} />;
export const TrendingUp = (props) => <IconBase src="graph-svgrepo-com.svg" {...props} />;
export const Trophy = (props) => <IconBase src="star-svgrepo-com.svg" {...props} />;
export const Tv = (props) => <IconBase src="cinema-film-movies-add-svgrepo-com.svg" {...props} />;
export const Type = (props) => <IconBase src="info-circle-svgrepo-com.svg" {...props} />;
export const Upload = (props) => <IconBase src="save-svgrepo-com.svg" {...props} />;
export const User = (props) => <IconBase src="drama-masks-svgrepo-com.svg" {...props} />;
export const UserCheck = (props) => <IconBase src="drama-masks-svgrepo-com.svg" {...props} />;
export const Users = (props) => <IconBase src="drama-masks-svgrepo-com.svg" {...props} />;
export const Volume2 = (props) => <IconBase src="speaker-wave-1-svgrepo-com.svg" {...props} />;
export const Wand2 = (props) => <IconBase src="star-svgrepo-com.svg" {...props} />;
export const X = (props) => <IconBase src="logout-svgrepo-com.svg" {...props} />;
export const ZoomIn = (props) => <IconBase src="search-alt-2-svgrepo-com.svg" {...props} />;
export const ZoomOut = (props) => <IconBase src="search-alt-2-svgrepo-com.svg" {...props} />;
