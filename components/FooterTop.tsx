import { Clock, Mail, Phone } from "lucide-react";

type FooterTopProps = {
  phone?: string | null;
  hours?: string | null;
  email?: string | null;
};

type ContactItemData = {
  title: string;
  description: string;
  icon: React.ReactNode;
};

export default function FooterTop({ phone, hours, email }: FooterTopProps) {
  const items: Array<ContactItemData | null> = [
    phone
      ? {
          title: "Appelez-nous",
          description: phone,
          icon: <Phone className="h-6 w-6 text-gray-600 transition-colors group-hover:text-shop_dark_green" />,
        }
      : null,
    hours
      ? {
          title: "Horaires",
          description: hours,
          icon: <Clock className="h-6 w-6 text-gray-600 transition-colors group-hover:text-shop_dark_green" />,
        }
      : null,
    email
      ? {
          title: "Ecrivez-nous",
          description: email,
          icon: <Mail className="h-6 w-6 text-gray-600 transition-colors group-hover:text-shop_dark_green" />,
        }
      : null,
  ];
  const data = items.filter((item): item is ContactItemData => item !== null);

  if (!data.length) {
    return null;
  }

  return (
    <div
      id="contact"
      className="grid scroll-mt-28 grid-cols-1 gap-3 border-b border-shop_light_green/20 py-6 sm:grid-cols-2 lg:grid-cols-3"
    >
      {data.map((item) => (
        <div
          key={item.title}
          className="group flex items-center gap-3 rounded-lg border border-shop_light_green/20 bg-white px-4 py-3 transition-all duration-300 hover:border-shop_light_green/45"
        >
          {item.icon}
          <div>
            <h3 className="text-sm font-bold text-gray-900 transition-colors group-hover:text-black">
              {item.title}
            </h3>
            <p className="mt-1 text-sm text-gray-600 transition-colors group-hover:text-gray-900">
              {item.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
