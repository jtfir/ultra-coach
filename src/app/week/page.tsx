import React from "react";

/**
 * Week page displays the user's training plan for the current week.
 * This page will summarise each day's run distance, elevation and
 * supplementary work. In a real implementation, this component would
 * fetch all plan_day entries for the next seven days and map them.
 */
export default function WeekPage() {
  return (
    <section>
      <h1 style={{ marginBottom: "1rem" }}>This Week</h1>
      <p>
        A weekly overview of your upcoming runs and workouts will appear here once your
        training plan has been seeded and you are authenticated.
      </p>
      <p>
        Each entry will include the planned distance, any mountain routes, strength and
        mobility sessions along with recommended supplement reminders.
      </p>
    </section>
  );
}
