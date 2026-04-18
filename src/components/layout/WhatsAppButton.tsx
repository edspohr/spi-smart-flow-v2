import { MessageCircle } from 'lucide-react';

// International format, no '+' or spaces (e.g. 573001234567 for Colombia)
const WHATSAPP_NUMBER = import.meta.env.VITE_SPI_WHATSAPP_NUMBER as string | undefined;

export default function WhatsAppButton() {
  if (!WHATSAPP_NUMBER) return null;

  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}`}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110 z-50 flex items-center justify-center"
    >
      <MessageCircle size={24} />
    </a>
  );
}
