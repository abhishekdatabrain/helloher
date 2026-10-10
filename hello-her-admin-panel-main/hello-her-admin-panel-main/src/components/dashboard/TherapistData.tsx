"use client";

import { toast } from "react-toastify";
import { Fetch } from "@/hooks/apiUtils";
import { useCallback, useEffect, useState } from "react";
import { format12Hour, formatDate } from "@/hooks/general";

const TherapistData = () => {
  const [limit, setLimit] = useState(5);
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [therapists, setTherapists] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const fetchAPI = useCallback(async () => {
    try {
      setLoading(true);
      setUsers([]);
      setSessions([]);
      setTherapists([]);
      setTransactions([]);
      setNotifications([]);
      const { data, message, success }: any = await Fetch(
        `admin/dashboard/overview?limit=${limit}`
      );
      if (success) {
        setUsers(data.users);
        setSessions(data.sessions);
        setTherapists(data.therapistslist);
        setTransactions(data.transactions);
        setNotifications(data.notifications);
        toast.success(message);
      }
    } catch (error) {
      console.log("Console error: " + error);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchAPI();
  }, [fetchAPI]);

  return (
    <>
      <div className="pt-6">
        <div className="flex justify-between items-center gap-4 pb-5">
          <h4 className="text-xl font-bold">Latest Updates</h4>
          <select
            value={limit}
            disabled={loading}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            className={`border border-primary focus:ring-2 focus:ring-primary outline-none rounded-lg px-6 text-xs py-2 font-medium`}
          >
            <option value="">--Select Limit--</option>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
          </select>
        </div>
        <div className="grid grid-cols-1 gap-4 mb-5">
          {therapists && therapists.length > 0 && (
            <div className="bg-primary/20 shadow rounded-lg p-4">
              <h3 className="text-base font-semibold mb-4">
                Category wise Sessions
              </h3>
              <table className="w-full text-left">
                <thead>
                  <tr className="text-white bg-primary">
                    <th className="py-2 w-1/4 text-xs pl-2 rounded-tl-lg">
                      Name
                    </th>
                    <th className="py-2 w-1/4 text-xs pl-2">Email</th>
                    <th className="py-2 w-1/4 text-xs pl-2">Category</th>
                    <th className="py-2 w-1/4 text-xs pl-2 rounded-tr-lg">
                      Total Sessions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {therapists.map((therapist: any) => {
                    return (
                      <tr key={therapist?._id} className="border-b bg-white">
                        <td className="py-2 w-1/4 text-xs pl-2">
                          {therapist?.name}
                        </td>
                        <td className="py-2 w-1/4 text-xs pl-2">
                          {therapist?.email}
                        </td>
                        <td className="py-2 w-1/4 text-xs pl-2">
                          {therapist?.specializations.map(
                            (e: any) => e.name + ", "
                          )}
                        </td>
                        <td className="py-2 w-[10%] text-xs pl-2">
                          {therapist?.sessionCountFiltered}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {users && users.length > 0 && (
            <div className="bg-primary/20 shadow rounded-lg p-4">
              <h3 className="text-base font-semibold mb-4">User Details</h3>
              <table className="w-full text-left">
                <thead>
                  <tr className="text-white bg-primary">
                    <th className="py-2 w-1/4 text-xs pl-2 rounded-tl-lg">
                      Name
                    </th>
                    <th className="py-2 w-1/4 text-xs pl-2">Gender</th>
                    <th className="py-2 w-1/4 text-xs pl-2">Email</th>
                    <th className="py-2 w-1/4 text-xs pl-2 rounded-tr-lg">
                      Ph. Number
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user: any) => {
                    return (
                      <tr key={user?._id} className="border-b bg-white">
                        <td className="py-2 w-1/4 text-xs pl-2">
                          {user?.firstName} {user?.lastName}
                        </td>
                        <td className="py-2 w-1/4 text-xs pl-2">
                          {user?.gender}
                        </td>
                        <td className="py-2 w-1/4 text-xs pl-2">
                          {user?.email}
                        </td>
                        <td className="py-2 w-[10%] text-xs pl-2">
                          {user?.mobile}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {notifications && notifications.length > 0 && (
            <div className="bg-primary/20 shadow rounded-lg p-4">
              <h3 className="text-base font-semibold mb-4">New Notifications</h3>
              <table className="w-full text-left">
                <thead>
                  <tr className="text-white bg-primary">
                    <th className="py-2 w-1/4 text-xs pl-2 rounded-tl-lg">
                      ID
                    </th>
                    <th className="py-2 w-1/2 text-xs pl-2">Message</th>
                    <th className="py-2 w-1/4 text-xs pl-2 rounded-tr-lg">
                      Date / Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((notify: any) => {
                    return (
                      <tr key={notify?._id} className="border-b bg-white">
                        <td className="py-2 w-1/4 text-xs pl-2">
                          {notify?._id}
                        </td>
                        <td className="py-2 w-1/2 text-xs pl-2">
                          {notify?.message}
                        </td>
                        <td className="py-2 w-1/4 text-xs pl-2">
                          {formatDate(notify?.createdAt)},{" "}
                          {format12Hour(notify?.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {sessions && sessions.length > 0 && (
            <div className="bg-primary/20 shadow rounded-lg p-4">
              <h3 className="text-base font-semibold mb-4">Upcoming Sessions</h3>
              <table className="w-full text-left">
                <thead>
                  <tr className="text-white bg-primary">
                    <th className="py-2 w-1/5 text-xs pl-2 rounded-tl-lg">
                      ID
                    </th>
                    <th className="py-2 w-1/5 text-xs pl-2">Therapist Name</th>
                    <th className="py-2 w-1/5 text-xs pl-2">User Name</th>
                    <th className="py-2 w-1/5 text-xs pl-2">Category</th>
                    <th className="py-2 w-1/5 text-xs pl-2 rounded-tr-lg">
                      Session time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session: any) => {
                    return (
                      <tr key={session?._id} className="border-b bg-white">
                        <td className="py-2 w-1/5 text-xs pl-2">
                          {session?._id.slice(-8)}
                        </td>
                        <td className="py-2 w-1/5 text-xs pl-2">
                          {session?.therapistName}
                        </td>
                        <td className="py-2 w-1/5 text-xs pl-2">
                          {session?.userName}
                        </td>
                        <td className="py-2 w-1/5 text-xs pl-2">
                          {session?.category}
                        </td>
                        <td className="py-2 w-1/5 text-xs pl-2">
                          {formatDate(session?.start_time)},{" "}
                          {format12Hour(session?.start_time)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {transactions && transactions.length > 0 && (
            <div className="bg-primary/20 shadow rounded-lg p-4">
              <h3 className="text-base font-semibold mb-4">
                Successful Transactions
              </h3>
              <table className="w-full text-left">
                <thead>
                  <tr className="text-white bg-primary">
                    <th className="py-2 w-1/5 text-xs pl-2 rounded-tl-lg">
                      Therapist Name
                    </th>
                    <th className="py-2 w-1/5 text-xs pl-2">User Name</th>
                    <th className="py-2 w-1/5 text-xs pl-2">Category</th>
                    <th className="py-2 w-1/5 text-xs pl-2">Amount</th>
                    <th className="py-2 w-1/5 text-xs pl-2 rounded-tr-lg">
                      Date / Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction: any) => {
                    return (
                      <tr key={transaction?._id} className="border-b bg-white">
                        <td className="py-2 w-1/5 text-xs pl-2">
                          {transaction?.therapistName}
                        </td>
                        <td className="py-2 w-1/5 text-xs pl-2">
                          {transaction?.userName}
                        </td>
                        <td className="py-2 w-1/5 text-xs pl-2">
                          {transaction?.category}
                        </td>
                        <td className="py-2 w-1/5 text-xs pl-2">
                          {transaction?.amount_INR > 0
                            ? `₹ ${transaction?.amount_INR}`
                            : `$ ${transaction?.amount_USD}`}
                        </td>
                        <td className="py-2 w-1/5 text-xs pl-2">
                          {formatDate(transaction?.createdAt)},{" "}
                          {format12Hour(transaction?.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TherapistData;
