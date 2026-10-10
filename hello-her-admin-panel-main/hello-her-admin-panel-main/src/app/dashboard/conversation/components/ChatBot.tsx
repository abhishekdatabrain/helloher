"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { FaComments } from "react-icons/fa";
import { Fetch } from "@/hooks/apiUtils";

interface Message {
    fromSelf: boolean;
    text: string;
    image?: string;
    audio?: string;
}

const NoConversation = () => (
    <div className="w-2/3 flex flex-col rounded-r-xl bg-whiteBg border-l border-infobg items-center justify-center text-gray-500 px-6 py-10 text-center">
        <FaComments className="text-green-400 text-6xl mb-6 animate-pulse" />
        <h2 className="text-2xl font-semibold mb-2">No Conversation Selected</h2>
        <p className="text-sm text-gray-500 mb-4 max-w-md">
            You haven&apos;t selected any chat yet. Choose a conversation from the list on the left.
        </p>
    </div>
);

const NoMessages = () => (
    <div className="flex flex-col items-center bg-primary justify-center py-10 h-full text-gray-500 px-6 text-center animate-fade-in">
        <div className="bg-green-100 p-6 rounded-full shadow-md mb-4">
            <FaComments className="text-green-600 text-5xl" />
        </div>
        <h2 className="text-2xl font-semibold text-iconBlack mb-2">No Conversations Yet</h2>
    </div>
);

interface ChatBoxProps {
    senderId: string;
    receiverId: string;
}

export default function ChatBox({ senderId, receiverId }: ChatBoxProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [senderAvatar, setSenderAvatar] = useState<string>("/assets/pp.png");
    const [receiverAvatar, setReceiverAvatar] = useState<string>("/assets/pp.png");
    const [senderName, setSenderName] = useState<string>("");
    const [receiverName, setReceiverName] = useState<string>("");

    const [senderProviderId, setSenderProviderId] = useState<string | null>(null);
    const [receiverProviderId, setReceiverProviderId] = useState<string | null>(null);

    useEffect(() => {
        const fetchMessages = async () => {
            if (!senderId || !receiverId) return;

            setLoading(true);
            try {
                const url = `/api/message/chat/${senderId}/${receiverId}`;
                const resp: any = await Fetch(url, {}, 5000, true, false);

                if (resp.success && resp.data) {
                    // Map messages
                    // const mapped: Message[] = resp.data.map((msg: any) => ({
                    //     fromSelf: msg.senderId === senderId,
                    //     text: msg.text,
                    // }));
                    const mapped: Message[] = resp.data.map((msg: any) => {
                        const audioMedia = msg.media?.find((m: any) => m.type === "audio");
                        const imageMedia = msg.media?.find((m: any) => m.type === "image");

                        return {
                            fromSelf: msg.senderId === senderId,
                            text: msg.text || "",
                            image: imageMedia?.url,
                            audio: audioMedia?.url, // ✅ THIS IS KEY
                        };
                    });
                    setMessages(mapped);

                    // ✅ Extract avatars & names from API response
                    const firstMessage = resp.data[0];
                    if (firstMessage) {
                        const senderInfo = firstMessage.senderInfo || {};
                        const receiverInfo = firstMessage.receiverInfo || {};

                        setSenderAvatar(senderInfo.activeImageUrl || "/assets/pp.png");
                        setReceiverAvatar(receiverInfo.activeImageUrl || "/assets/pp.png");

                        setSenderName(senderInfo.name || "Unknown Sender");
                        setReceiverName(receiverInfo.name || "Unknown Receiver");

                        setSenderProviderId(senderInfo.providerId || null);
                        setReceiverProviderId(receiverInfo.providerId || null);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch messages:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
    }, [senderId, receiverId]);

    if (!senderId || !receiverId) return <NoConversation />;

    return (
        <div className="w-2/3 h-screen flex flex-col rounded-r-xl border-l bg-primary border-primary bg-white relative ">
            {/* ================= HEADER ================= */}
            <div className="flex items-center gap-4 bg-primary rounded-r-xl shadow-md px-4 py-3 border-b border-primary ">
                <div className="relative w-14">
                    <Image
                        src={senderAvatar}
                        alt={senderName}
                        width={40}
                        height={40}
                        unoptimized
                        className="w-10 h-10 rounded-full  border-2 border-secondary"
                    />
                    <Image
                        src={receiverAvatar}
                        alt={receiverName}
                        width={40}
                        height={40}
                        unoptimized
                        className="w-10 h-10 rounded-full border-2 border-secondary absolute -right-3 top-0"
                    />
                </div>
                {/* <div className="flex flex-col">
                    <h2 className="text-md font-semibold text-white">{senderName}</h2>
                    <p className="text-sm text-white">{receiverName}</p>
                </div> */}
                <div className="flex flex-col">
                    <h2 className="text-md font-semibold text-white flex items-center gap-2">
                        {senderName}
                        {senderProviderId && (
                            <span className="text-xs bg-white/20 px-2 py-0.5 rounded">
                                {senderProviderId}
                            </span>
                        )}
                    </h2>

                    <p className="text-sm text-white flex items-center gap-2">
                        {receiverName}
                        {receiverProviderId && (
                            <span className="text-xs bg-white/20 px-2 py-0.5 rounded">
                                {receiverProviderId}
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {/* ================= CHAT BODY ================= */}
            <div
                className="flex-1 relative overflow-hidden"
                style={{
                    backgroundImage: "url('/assets/bg/bg.jpg')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                }}
            >
                <div
                    className="pointer-events-none absolute inset-0 bg-white/5 backdrop-blur-sm z-0"
                    aria-hidden
                />
                <div className="relative z-10 h-full overflow-y-auto p-4 space-y-4">
                    {loading ? (
                        <p className="text-center text-gray-500">Loading...</p>
                    ) : messages.length === 0 ? (
                        <NoMessages />
                    ) : (
                        messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex gap-2 ${msg.fromSelf ? "justify-end" : ""}`}
                            >
                                {!msg.fromSelf && (
                                    <Image
                                        width={100}
                                        height={100}
                                        unoptimized
                                        alt="avatar"
                                        src={receiverAvatar}
                                        className="w-8 h-8 rounded-full object-cover ring-2 ring-green-400"
                                    />
                                )}
                                <div
                                    className={`rounded-md px-4 py-2 max-w-xs text-sm ${msg.fromSelf
                                        ? "bg-primary opacity-95  text-white font-bold"
                                        : "bg-white/85 text-gray-800 font-bold"
                                        }`}
                                >
                                    {msg.text}

                                    {msg.image && (
                                        <Image
                                            width={100}
                                            height={100}
                                            unoptimized
                                            alt="chat image"
                                            src={msg.image}
                                            className="mt-2 rounded-lg w-32 h-32 object-cover"
                                        />
                                    )}

                                    {msg.audio && (
                                        <audio controls
                                            controlsList="nodownload noplaybackrate noremoteplayback"

                                            className="mt-2 w-52">
                                            <source src={msg.audio} type="audio/aac" />
                                            Your browser does not support audio.
                                        </audio>
                                    )}
                                </div>
                                {msg.fromSelf && (
                                    <Image
                                        width={100}
                                        height={100}
                                        unoptimized
                                        alt="avatar"
                                        src={senderAvatar}
                                        className="w-8 h-8 rounded-full object-cover  ring-2 ring-green-400"
                                    />
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}




// "use client";

// import Image from "next/image";
// import { useState, useEffect } from "react";
// import { FaComments } from "react-icons/fa";
// import { Fetch } from "@/hooks/apiUtils";

// interface Message {
//     fromSelf: boolean;
//     text: string;
//     image?: string;
// }

// const NoConversation = () => (
//     <div className="w-2/3 flex flex-col rounded-r-xl bg-whiteBg border-l border-infobg items-center justify-center text-gray-500 px-6 py-10 text-center">
//         <FaComments className="text-green-400 text-6xl mb-6 animate-pulse" />
//         <h2 className="text-2xl font-semibold mb-2">No Conversation Selected</h2>
//         <p className="text-sm text-gray-500 mb-4 max-w-md">
//             You haven&apos;t selected any chat yet. Choose a conversation from the list on the left.
//         </p>
//     </div>
// );

// const NoMessages = () => (
//     <div className="flex flex-col items-center bg-primary justify-center py-10 h-full text-gray-500 px-6 text-center animate-fade-in">
//         <div className="bg-green-100 p-6 rounded-full shadow-md mb-4">
//             <FaComments className="text-green-600 text-5xl" />
//         </div>
//         <h2 className="text-2xl font-semibold text-iconBlack mb-2">No Conversations Yet</h2>
//     </div>
// );

// interface ChatBoxProps {
//     senderId: string;
//     receiverId: string;
// }

// export default function ChatBox({ senderId, receiverId }: ChatBoxProps) {
//     const [messages, setMessages] = useState<Message[]>([]);
//     const [loading, setLoading] = useState(false);
//     // const [image, setImage] = useState<File | null>(null);
//     const [senderAvatar, setSenderAvatar] = useState<string>("/assets/pp.png");
//     const [receiverAvatar, setReceiverAvatar] = useState<string>("/assets/pp.png");

//     useEffect(() => {
//         const fetchMessages = async () => {
//             if (!senderId || !receiverId) return;

//             setLoading(true);
//             try {
//                 const url = `/api/message/chat/${senderId}/${receiverId}`;
//                 const resp: any = await Fetch(url, {}, 5000, true, false);

//                 if (resp.success && resp.data) {
//                     // Map messages
//                     const mapped: Message[] = resp.data.map((msg: any) => ({
//                         fromSelf: msg.senderId === senderId,
//                         text: msg.text,
//                     }));
//                     setMessages(mapped);

//                     // Get avatars from first gallery image if exists
//                     if (resp.data[0]) {
//                         const firstMessage = resp.data[0];
//                         const senderGallery = firstMessage.senderInfo?.profilePicture || [];
//                         const receiverGallery = firstMessage.receiverInfo?.profilePicture || [];

//                         setSenderAvatar(senderGallery || "/assets/pp.png");
//                         setReceiverAvatar(receiverGallery || "/assets/pp.png");
//                     }
//                 }
//             } catch (err) {
//                 console.error("Failed to fetch messages:", err);
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchMessages();
//     }, [senderId, receiverId]);

//     if (!senderId || !receiverId) return <NoConversation />;
//     return (
//         <div className="w-2/3 h-screen flex flex-col rounded-r-xl border-l bg-primary border-green-300 bg-white relative">
//             <div
//                 className="flex-1 overflow-y-auto p-4 space-y-4 relative"
//                 style={{
//                     backgroundImage: "url('/assets/bg/bg2.jpg')",
//                     backgroundSize: "cover",
//                     backgroundPosition: "center",
//                     backgroundRepeat: "no-repeat",
//                 }}
//             >
//                 <div className="absolute inset-0 bg-white/5 backdrop-blur-sm z-0" />
//                 <div className="relative z-10 space-y-4">
//                     {loading ? (
//                         <p className="text-center text-gray-500">Loading...</p>
//                     ) : messages.length === 0 ? (
//                         <NoMessages />
//                     ) : (
//                         messages.map((msg, index) => (
//                             <div
//                                 key={index}
//                                 className={`flex gap-2 ${msg.fromSelf ? "justify-end" : ""}`}
//                             >
//                                 {!msg.fromSelf && (
//                                     <Image
//                                         width={100}
//                                         height={100}
//                                         unoptimized
//                                         alt="avatar"
//                                         src={receiverAvatar}
//                                         className="w-8 h-8 rounded-full object-cover ring-2 ring-green-400"
//                                     />
//                                 )}
//                                 <div
//                                     className={`rounded-md px-4 py-2 max-w-xs text-sm ${msg.fromSelf
//                                         ? "bg-primary text-iconBlack font-bold"
//                                         : "bg-white/80 text-gray-800"
//                                         }`}
//                                 >
//                                     {msg.text}
//                                     {msg.image && (
//                                         <Image
//                                             width={100}
//                                             height={100}
//                                             unoptimized
//                                             alt="chat image"
//                                             src={msg.image}
//                                             className="mt-2 rounded-lg w-32 h-32 object-cover"
//                                         />
//                                     )}
//                                 </div>
//                                 {msg.fromSelf && (
//                                     <Image
//                                         width={100}
//                                         height={100}
//                                         unoptimized
//                                         alt="avatar"
//                                         src={senderAvatar}
//                                         className="w-8 h-8 rounded-full object-cover ring-2 ring-green-400"
//                                     />
//                                 )}
//                             </div>
//                         ))
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// }
