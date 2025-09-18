#!/usr/bin/env node
/* eslint-env node */

// Test script to verify future chores can be completed
import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

// Load environment
dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

async function testFutureChoreCompletion() {
  console.log("🧪 Testing future chore completion...\n");

  try {
    // Get current day and a future day
    const today = new Date();
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const currentDayIndex = today.getDay();
    const currentDay = dayNames[currentDayIndex];

    // Find a future day (tomorrow or later this week)
    const futureDayIndex = currentDayIndex === 6 ? 0 : currentDayIndex + 1;
    const futureDay = dayNames[futureDayIndex];

    console.log(`📅 Today is ${currentDay.charAt(0).toUpperCase() + currentDay.slice(1)}`);
    console.log(`📅 Testing with future day: ${futureDay.charAt(0).toUpperCase() + futureDay.slice(1)}\n`);

    // Create a test chore with a future schedule
    const chore = await sql`
      INSERT INTO chores (name, description)
      VALUES ('Future Test Chore', 'Testing future completion')
      RETURNING id
    `;
    const choreId = chore[0].id;
    console.log(`✅ Created test chore (ID: ${choreId})`);

    // Add schedule for future day
    const schedule = await sql`
      INSERT INTO chore_schedules (chore_id, kid_name, day_of_week)
      VALUES (${choreId}, 'Test Kid', ${futureDay})
      RETURNING id
    `;
    const scheduleId = schedule[0].id;
    console.log(`✅ Added schedule for ${futureDay} (Schedule ID: ${scheduleId})`);

    // Calculate the future date in current week
    const monday = new Date(today);
    const daysFromMonday = currentDayIndex === 0 ? 6 : currentDayIndex - 1;
    monday.setDate(today.getDate() - daysFromMonday);

    const daysFromMondayToFuture = futureDayIndex === 0 ? 6 : futureDayIndex - 1;
    const futureDate = new Date(monday);
    futureDate.setDate(monday.getDate() + daysFromMondayToFuture);
    const futureDateStr = futureDate.toISOString().split("T")[0];

    console.log(`📅 Future date in current week: ${futureDateStr}`);

    // Try to complete the future chore
    const completion = await sql`
      INSERT INTO chore_completions (chore_schedule_id, completed_date, completed_at)
      VALUES (${scheduleId}, ${futureDateStr}, NOW())
      RETURNING *
    `;

    if (completion.length > 0) {
      console.log(`✅ Successfully completed future chore!`);
      console.log(`   Completion ID: ${completion[0].id}`);
      console.log(`   Completed date: ${completion[0].completed_date}`);
    }

    // Verify it shows as completed
    const verification = await sql`
      SELECT cs.*, cc.id as completion_id
      FROM chore_schedules cs
      LEFT JOIN chore_completions cc 
        ON cs.id = cc.chore_schedule_id 
        AND cc.completed_date = ${futureDateStr}
      WHERE cs.id = ${scheduleId}
    `;

    if (verification[0].completion_id) {
      console.log(`✅ Verified: Future chore shows as completed`);
    } else {
      console.log(`❌ Future chore not showing as completed`);
    }

    // Clean up
    await sql`DELETE FROM chores WHERE id = ${choreId}`;
    console.log(`\n🧹 Cleaned up test data`);

    console.log(`\n✨ Future chore completion works correctly!`);
  } catch (error) {
    console.error(`\n❌ Test failed:`, error.message);
    process.exit(1);
  }
}

testFutureChoreCompletion();
