"use client";

import { useState } from "react";
import ChatList from "./components/ChatList";
import AuthGuard from "@/components/AuthGuard";
import Wrapper from "@/components/common/Wrapper";
import ChatBox from "./components/ChatBot";

const Dashboard: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  console.log(selectedUser);
  return (
    <AuthGuard>
      <Wrapper>
        <div className="flex">
          <ChatList
            onSelect={setSelectedUser}
            selectedUserId={selectedUser?.id || null}
          />
          <ChatBox
            senderId={selectedUser?.senderId}
            receiverId={selectedUser?.receiverId}
          />
        </div>
      </Wrapper>
    </AuthGuard>
  );
};

export default Dashboard;