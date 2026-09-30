import { useState } from "react";

export default function InviteVolunteerDropdown({
  volunteers = [],
  inviteMutation,
  isLoading
}) {
  const [selectedVolunteer, setSelectedVolunteer] = useState("");

  const handleInvite = () => {
    inviteMutation(Number(selectedVolunteer));
  };

  return (
    <div className="flex gap-4 items-center">
      <select
        value={selectedVolunteer}
        onChange={(e) => setSelectedVolunteer(e.target.value)}
        disabled={isLoading}
        className="border rounded-lg px-4 py-2 w-80 disabled:opacity-60"
      >
        <option value="">Select a volunteer</option>

        {volunteers.map((vol) => (
          <option key={vol.id} value={vol.id}>
            {vol.name}
          </option>
        ))}
      </select>

      <button
        disabled={!selectedVolunteer || isLoading}
        onClick={handleInvite}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
      >
        {isLoading ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Inviting
          </>
        ) : (
          "Invite"
        )}
      </button>
    </div>
  );
}