import { db } from "#data";

// -------------------- ROOM --------------------

function generateRoomID() {
    return Math.floor(100000 + Math.random() * 900000);
}

export async function createRoom(hostID) {
    if (!hostID) return null;

    let roomID;

    do {
        roomID = generateRoomID();
    } while (await db.get("SELECT id FROM rooms WHERE id = ?", [roomID]));

    await db.run(
        `INSERT INTO rooms (id, host, game, member)
         VALUES (?, ?, ?, ?)`,
        [roomID, hostID, null, JSON.stringify({})]
    );

    return roomID;
}

export async function destroyRoom(roomID) {
    if (!roomID) return false;

    const result = await db.run("DELETE FROM rooms WHERE id = ?", [roomID]);

    return result.changes > 0;
}

export async function getAllRooms() {
    const rows = await db.all("SELECT * FROM rooms");

    if (!rows || rows.length === 0) return [];

    return rows.map((r) => ({
        ...r,
        member: JSON.parse(r.member || "[]"),
    }));
}

export async function getRoom(roomID) {
    if (!roomID) return null;

    const row = await db.get("SELECT * FROM rooms WHERE id = ?", [roomID]);

    if (!row) return null;

    return {
        ...row,
        member: JSON.parse(row.member),
    };
}

export async function getUserRoom(userID) {
    if (!userID) return null;

    let room = await db.get("SELECT * FROM rooms WHERE host = ?", [userID]);

    if (room) {
        return {
            ...room,
            member: JSON.parse(room.member || "[]"),
        };
    }

    const rooms = await db.all("SELECT * FROM rooms");

    for (const r of rooms) {
        const members = JSON.parse(r.member || "[]");
        if (members.includes(userID)) {
            return {
                ...r,
                member: members,
            };
        }
    }

    return "NO_ROOM";
}

export async function isInRoom(userID) {
    if (!userID) return false;

    let row = await db.get("SELECT id FROM rooms WHERE host = ?", [userID]);
    if (row) return true;

    const rooms = await db.all("SELECT member FROM rooms");

    for (const room of rooms) {
        const members = JSON.parse(room.member || "[]");
        if (members.includes(userID)) {
            return true;
        }
    }

    return false;
}

// -------------------- MEMBER --------------------

export async function addMember(roomID, userID) {
    if (!roomID || !userID) return false;

    const room = await db.get("SELECT member FROM rooms WHERE id = ?", [
        roomID,
    ]);
    if (!room) return false;

    const members = JSON.parse(room.member || "[]");

    if (!members.includes(userID)) {
        members.push(userID);
    }

    await db.run("UPDATE rooms SET member = ? WHERE id = ?", [
        JSON.stringify(members),
        roomID,
    ]);

    return true;
}

export async function removeMember(userID) {
    if (!userID) return false;

    let room = await db.get(
        "SELECT id, host, member FROM rooms WHERE host = ?",
        [userID]
    );

    if (room) {
        await db.run("DELETE FROM rooms WHERE id = ?", [room.id]);
        return "ROOM_CLOSED";
    }

    const rooms = await db.all("SELECT id, host, member FROM rooms");

    for (const r of rooms) {
        const members = JSON.parse(r.member || "[]");

        if (members.includes(userID)) {
            const updated = members.filter((id) => id !== userID);

            await db.run("UPDATE rooms SET member = ? WHERE id = ?", [
                JSON.stringify(updated),
                r.id,
            ]);

            return true;
        }
    }

    return false;
}
