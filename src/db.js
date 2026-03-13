import * as SQLite from 'expo-sqlite';

let db = null;

export const initDB = async () => {
    if (db) return db; // already initialized
    db = await SQLite.openDatabaseAsync('syllabus.db');

    // Create relational tables for Syllabus
    await db.execAsync(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS subjects (
        id TEXT PRIMARY KEY,
        title TEXT
      );
      CREATE TABLE IF NOT EXISTS chapters (
        id TEXT PRIMARY KEY,
        subject_id TEXT,
        title TEXT,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS topics (
        id TEXT PRIMARY KEY,
        chapter_id TEXT,
        title TEXT,
        done INTEGER DEFAULT 0,
        FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS study_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT UNIQUE
      );
      CREATE TABLE IF NOT EXISTS plan_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plan_id INTEGER,
        subject_id TEXT,
        topic_title TEXT,
        hours REAL,
        FOREIGN KEY (plan_id) REFERENCES study_plans(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
      );
    `);
    console.log("Database initialized successfully.");
    return db;
};

const getDB = async () => {
    if (!db) await initDB();
    if (!db) throw new Error("Database could not be initialized.");
    return db;
};

export const loadSyllabusFromDB = async () => {
    const database = await getDB();
    try {
        const subjects = await database.getAllAsync('SELECT * FROM subjects');
        const chapters = await database.getAllAsync('SELECT * FROM chapters');
        const topics = await database.getAllAsync('SELECT * FROM topics');

        // Reconstruct nested hierarchy
        const subjectMap = subjects.reduce((acc, sub) => {
            acc[sub.id] = { ...sub, chapters: [] };
            return acc;
        }, {});

        const chapterMap = chapters.reduce((acc, ch) => {
            acc[ch.id] = { ...ch, topics: [] };
            if (subjectMap[ch.subject_id]) {
                subjectMap[ch.subject_id].chapters.push(acc[ch.id]);
            }
            return acc;
        }, {});

        topics.forEach(t => {
            if (chapterMap[t.chapter_id]) {
                chapterMap[t.chapter_id].topics.push({
                    ...t,
                    done: t.done === 1
                });
            }
        });

        return Object.values(subjectMap);
    } catch (error) {
        console.error("Error loading syllabus from DB:", error);
        return [];
    }
};

export const saveSyllabusToDB = async (data) => {
    const database = await getDB();
    try {
        await database.withTransactionAsync(async () => {
            // Clear existing records to mirror the state array exactly
            await database.runAsync(`DELETE FROM topics;`);
            await database.runAsync(`DELETE FROM chapters;`);
            await database.runAsync(`DELETE FROM subjects;`);

            // Bulk insert everything
            for (const subject of data) {
                await database.runAsync('INSERT INTO subjects (id, title) VALUES (?, ?)', [subject.id, subject.title]);
                for (const chapter of subject.chapters) {
                    await database.runAsync('INSERT INTO chapters (id, subject_id, title) VALUES (?, ?, ?)', [chapter.id, subject.id, chapter.title]);
                    for (const topic of chapter.topics) {
                        await database.runAsync('INSERT INTO topics (id, chapter_id, title, done) VALUES (?, ?, ?, ?)', [topic.id, chapter.id, topic.title, topic.done ? 1 : 0]);
                    }
                }
            }
        });
    } catch (error) {
        console.error("Error saving syllabus to DB:", error);
    }
};

export const loadStudyPlanFromDB = async () => {
    const database = await getDB();
    try {
        const plans = await database.getAllAsync('SELECT * FROM study_plans ORDER BY id ASC');
        if (!plans || plans.length === 0) return null;

        const generatedPlan = [];

        for (const plan of plans) {
            const assignmentsRaw = await database.getAllAsync('SELECT * FROM plan_assignments WHERE plan_id = ?', [plan.id]);
            const assignments = {};

            assignmentsRaw.forEach(assign => {
                if (!assignments[assign.subject_id]) {
                    assignments[assign.subject_id] = [];
                }
                assignments[assign.subject_id].push({
                    title: assign.topic_title,
                    hours: assign.hours
                });
            });

            generatedPlan.push({
                date: plan.date,
                assignments: assignments
            });
        }
        return generatedPlan;
    } catch (error) {
        console.error("Error loading study plan from DB:", error);
        return null;
    }
};

export const saveStudyPlanToDB = async (planData) => {
    const database = await getDB();
    try {
        await database.withTransactionAsync(async () => {
            await database.runAsync(`DELETE FROM plan_assignments;`);
            await database.runAsync(`DELETE FROM study_plans;`);

            if (!planData) return;

            for (const day of planData) {
                const result = await database.runAsync('INSERT INTO study_plans (date) VALUES (?)', [day.date]);
                const planId = result.lastInsertRowId;

                for (const subjectId in day.assignments) {
                    for (const topic of day.assignments[subjectId]) {
                        await database.runAsync(
                            'INSERT INTO plan_assignments (plan_id, subject_id, topic_title, hours) VALUES (?, ?, ?, ?)',
                            [planId, subjectId, topic.title, topic.hours]
                        );
                    }
                }
            }
        });
    } catch (error) {
        console.error("Error saving study plan to DB:", error);
    }
};
