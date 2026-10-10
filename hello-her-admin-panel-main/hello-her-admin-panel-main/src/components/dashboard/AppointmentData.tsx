const AppointmentData = () => {
  return (
    <>
      <div className="bg-primary/20 shadow rounded-lg p-4 mb-4">
        <h3 className="text-base font-semibold mb-4">Appointments</h3>
        <div className="flex mb-4 gap-5">
          <button className="px-4 py-2 bg-white rounded-lg">
            Today&apos;s Sessions
          </button>
          <button className="px-4 py-2 bg-white rounded-lg">
            Upcoming Sessions
          </button>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="text-white bg-primary">
              <th className="py-2 text-xs pl-2 rounded-tl-lg">ID</th>
              <th className="py-2 text-xs pl-2">Name</th>
              <th className="py-2 text-xs pl-2">Time</th>
              <th className="py-2 text-xs pl-2">Next Visit</th>
              <th className="py-2 text-xs pl-2">Therapist Name</th>
              <th className="py-2 text-xs pl-2">Date</th>
              <th className="py-2 text-xs pl-2 rounded-tr-lg">Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b bg-white">
              <td className="py-2 text-xs pl-2">P568892</td>
              <td className="py-2 text-xs pl-2">John Doe</td>
              <td className="py-2 text-xs pl-2">9:00 AM</td>
              <td className="py-2 text-xs pl-2">10-09-2024</td>
              <td className="py-2 text-xs pl-2">Dr. Walsh</td>
              <td className="py-2 text-xs pl-2">12-09-2024</td>
              <td className="py-2 text-xs pl-2">Adult Therapy</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-primary/20 shadow rounded-lg p-4">
        <h3 className="text-base font-semibold mb-4">Appointments</h3>
        <div className="flex justify-between mb-4 gap-5">
          <div className="space-x-4">
            <button className="px-4 py-2 bg-white rounded-lg">
              All Appointments
            </button>
            <button className="px-4 py-2 bg-white rounded-lg">
              Pending Payments
            </button>
            <button className="px-4 py-2 bg-white rounded-lg">
              Completed Payments
            </button>
          </div>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="text-white bg-primary">
              <th className="py-2 pl-2 text-xs rounded-tl-lg">
                Transaction ID
              </th>
              <th className="py-2 pl-2 text-xs">Date</th>
              <th className="py-2 pl-2 text-xs">Time</th>
              <th className="py-2 pl-2 text-xs">Status</th>
              <th className="py-2 pl-2 text-xs">Pay Method</th>
              <th className="py-2 pl-2 text-xs rounded-tr-lg">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b bg-white">
              <td className="py-2 pl-2 text-xs">#3721</td>
              <td className="py-2 pl-2 text-xs">23 Aug 2024</td>
              <td className="py-2 pl-2 text-xs">4:30pm</td>
              <td className="py-2 pl-2 text-xs">Completed</td>
              <td className="py-2 pl-2 text-xs">Credit Card</td>
              <td className="py-2 text-primary">+ ₹1450</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};

export default AppointmentData;
