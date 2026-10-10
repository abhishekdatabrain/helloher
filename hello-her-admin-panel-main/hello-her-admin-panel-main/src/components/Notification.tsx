import { useRouter } from "next/navigation";
import { IoIosNotifications } from "react-icons/io";

const Notification = () => {
  const router = useRouter();
  return (
    <div
      className="relative group"
      onClick={() => router.push("/dashboard/notifications")}
    >
      <IoIosNotifications className="text-3xl group-hover:scale-110 transition cursor-pointer" />
    </div>
  );
};

export default Notification;
