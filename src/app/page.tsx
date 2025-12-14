import React from "react";

export default function HomePage() {
  return (
    <section>
      <h1 style={{ marginBottom: "1rem" }}>Welcome to Ultra Coach</h1>
      <p>
        This application provides a personalized training plan for your upcoming ultra event.
      </p>
      <p>
        Use the navigation above to view your plan for today or the entire week. Head to
        <strong> Settings </strong>
        to connect your Strava account and configure your daily email notifications.
      </p>
      <p style={{ marginTop: "1rem" }}>
        Looking to generate your initial plan? Use our seeding endpoint to populate your
        database with an 8-week base phase designed for mountain and flat runs.
      </p>
    </section>
  );
}
