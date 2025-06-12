const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const duration = require('dayjs/plugin/duration');
const isSameOrAfter = require('dayjs/plugin/isSameOrAfter');
const { SlashCommandBuilder } = require('discord.js');

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);
dayjs.extend(isSameOrAfter);

function timeUntilOrSinceThisTuesdayPST() {
    const localTimezone = 'Europe/Stockholm'; // Local timezone
    const targetTimezone = 'America/Los_Angeles'; // Target timezone

    // Get current time in local timezone
    const now = dayjs().tz(localTimezone);

    // Calculate this week's Tuesday at 9:00 AM PST
    let startOfWeek = dayjs().tz(targetTimezone).startOf('week').add(1, 'day'); // Start of week + 1 day = Monday
    let thisTuesdayPST = startOfWeek.add(1, 'day').hour(9).minute(0).second(0); // Tuesday 9:00 AM PST
    let thisTuesdayLocal = thisTuesdayPST.tz(localTimezone); // Convert Tuesday PST to local timezone

    const thisFridayPST = startOfWeek.add(4, 'days').hour(9).minute(0).second(0); // Friday 9:00 AM PST
    const thisFridayLocal = thisFridayPST.tz(localTimezone); // Convert Friday PST to local timezone

    if (now.isSameOrAfter(thisTuesdayLocal) && now.isBefore(thisFridayLocal)) {
        // Time since last reset
        const diffInMinutes = now.diff(thisTuesdayLocal, 'minutes');
        const totalHours = Math.floor(diffInMinutes / 60);
        const hours = totalHours % 24;
        const days = Math.floor(totalHours / 24);

        return {
            days,
            hours,
            minutes: diffInMinutes % 60,
            isPast: true,
            isSameWeek: true,
        };
    } else if (now.isBefore(thisTuesdayLocal)) {
        // Time until next reset
        const diffInMinutes = thisTuesdayLocal.diff(now, 'minutes');
        const totalHours = Math.floor(diffInMinutes / 60);
        const hours = totalHours % 24;
        const days = Math.floor(totalHours / 24);

        return {
            days,
            hours,
            minutes: diffInMinutes % 60,
            isPast: false,
            isSameWeek: true,
        };
    } else {
        // After Friday 9:00 AM PST
        return {
            days: 0,
            hours: 0,
            minutes: 0,
            isPast: false,
            isSameWeek: false,
        };
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('next')
        .setDescription('Check time since or until this Tuesday at 9:00 AM PST'),
    async execute(interaction) {
        const { days, hours, minutes, isPast, isSameWeek } = timeUntilOrSinceThisTuesdayPST();
        if (isPast && isSameWeek) {
            await interaction.reply(`It has been ${days} days, ${hours} hours, and ${minutes} minutes since reset.`);
        } else if (!isPast && isSameWeek) {
            await interaction.reply(`The next reset is in ${days} days, ${hours} hours, and ${minutes} minutes.`);
        } else {
            await interaction.reply(`The next reset is in ${days} days, ${hours} hours, and ${minutes} minutes.`);
        }
    },
};
