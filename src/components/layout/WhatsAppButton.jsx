import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton() {
  return (
    <a 
      href="https://wa.me/1234567890" 
      target="_blank" 
      rel="noreferrer"
      className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110 z-50 flex items-center justify-center"
    >
      <MessageCircle size={24} />
    </a>
  );
}
