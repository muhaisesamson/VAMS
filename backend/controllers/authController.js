/*const bcrypt = require("bcrypt");
const db = require("../config/db");

const registerUser = async (req, res) => {

    const client = await db.connect();

    try {

        await client.query("BEGIN");

        const {
            first_name,
            last_name,
            gender,
            date_of_birth,
            national_id,
            phone,
            service_number,
            service_branch,
            rank,
            years_served,
            email,
            password
        } = req.body;

        // Validate required fields
        if (
            !first_name ||
            !last_name ||
            !gender ||
            !date_of_birth ||
            !national_id ||
            !phone ||
            !service_number ||
            !service_branch ||
            !rank ||
            !years_served ||
            !email ||
            !password
        ) {

            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "Please complete all required fields."
            });

        }

        // Check existing email
        const existingEmail = await client.query(

            "SELECT id FROM users WHERE email = $1",

            [email]

        );

        if (existingEmail.rows.length > 0) {

            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                message: "Email already exists."
            });

        }

        // Check existing National ID
        const existingNIN = await client.query(

            "SELECT id FROM veterans WHERE national_id = $1",

            [national_id]

        );

        if (existingNIN.rows.length > 0) {

            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                message: "National ID already registered."
            });

        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const userResult = await client.query(

            `INSERT INTO users
            (email, password)
            VALUES ($1, $2)
            RETURNING id`,

            [email, hashedPassword]

        );

        const userId = userResult.rows[0].id;

        // Create veteran profile
        const veteran = await client.query(

        `INSERT INTO veterans
        (
        user_id,
        first_name,
        last_name,
        gender,
        date_of_birth,
        national_id,
        phone,
        service_number,
        service_branch,
        rank,
        years_served
        )

        VALUES
        (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
        )

        RETURNING id`

        ,

        [
        userId,
        first_name,
        last_name,
        gender,
        date_of_birth,
        national_id,
        phone,
        service_number,
        service_branch,
        rank,
        years_served
        ]

    );

    const files = req.files;

    async function saveDocument(field, type) {

        if (!files[field]) return;

        await client.query(

            `INSERT INTO verification_documents
            (
                veteran_id,
                document_type,
                file_path
            )
            VALUES
            (
                $1,$2,$3
            )`,

            [

                veteranId,

                type,

                files[field][0].path

            ]

        );

    }

    await saveDocument(

        "national_id_file",

        "National ID"

    );

    await saveDocument(

        "army_id_file",

        "Army ID"

    );

    await saveDocument(

        "discharge_file",

        "Discharge Certificate"

    );

    if (files.supporting_docs) {

        for (const document of files.supporting_docs) {

            await client.query(

                `INSERT INTO verification_documents
                (
                    veteran_id,
                    document_type,
                    file_path
                )
                VALUES
                (
                    $1,$2,$3
                )`,

                [

                    veteranId,

                    "Supporting Document",

                    document.path

                ]

            );

        }

    }

const veteranId = veteran.rows[0].id;

        await client.query("COMMIT");

        return res.status(201).json({

            success: true,
            message: "Registration submitted successfully. Your account is awaiting verification."

        });

    }

    catch (error) {

        await client.query("ROLLBACK");

        console.error(error);

        return res.status(500).json({

            success: false,
            message: "Server Error"

        });

    }

    finally {

        client.release();

    }

};

module.exports = {
    registerUser
};



*/


/*

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");


// ===========================
// REGISTER
// ===========================

const registerUser = async (req, res) => {

    const client = await db.connect();

    try {

        await client.query("BEGIN");

        const {
            first_name,
            last_name,
            gender,
            date_of_birth,
            national_id,
            phone,
            service_number,
            service_branch,
            rank,
            years_served,
            email,
            password
        } = req.body;

        // Validate required fields
        if (
            !first_name || !last_name || !gender || !date_of_birth ||
            !national_id || !phone || !service_number || !service_branch ||
            !rank || !years_served || !email || !password
        ) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: "Please complete all required fields."
            });
        }

        // Check existing email
        const existingEmail = await client.query(
            "SELECT id FROM users WHERE email = $1",
            [email]
        );

        if (existingEmail.rows.length > 0) {
            await client.query("ROLLBACK");
            return res.status(409).json({
                success: false,
                message: "Email already registered."
            });
        }

        // Check existing National ID
        const existingNIN = await client.query(
            "SELECT id FROM veterans WHERE national_id = $1",
            [national_id]
        );

        if (existingNIN.rows.length > 0) {
            await client.query("ROLLBACK");
            return res.status(409).json({
                success: false,
                message: "National ID already registered."
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const userResult = await client.query(
            `INSERT INTO users (email, password)
             VALUES ($1, $2)
             RETURNING id`,
            [email, hashedPassword]
        );

        const userId = userResult.rows[0].id;

        // Create veteran profile
        const veteranResult = await client.query(
            `INSERT INTO veterans
             (user_id, first_name, last_name, gender, date_of_birth,
              national_id, phone, service_number, service_branch, rank, years_served)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
             RETURNING id`,
            [
                userId, first_name, last_name, gender, date_of_birth,
                national_id, phone, service_number, service_branch, rank, years_served
            ]
        );

        // BUG FIX: veteranId must be declared BEFORE saveDocument uses it
        const veteranId = veteranResult.rows[0].id;

        // Save uploaded documents
        const files = req.files || {};

        async function saveDocument(field, type) {
            if (!files[field] || files[field].length === 0) return;
            const file = files[field][0];
            await client.query(
                `INSERT INTO verification_documents
                 (veteran_id, document_type, file_name, file_path)
                 VALUES ($1, $2, $3, $4)`,
                [veteranId, type, file.originalname, file.path]
            );
        }

        await saveDocument("national_id_file", "National ID");
        await saveDocument("army_id_file", "Army ID");
        await saveDocument("discharge_file", "Discharge Certificate");

        // Supporting docs (multiple files)
        if (files.supporting_docs && files.supporting_docs.length > 0) {
            for (const file of files.supporting_docs) {
                await client.query(
                    `INSERT INTO verification_documents
                     (veteran_id, document_type, file_name, file_path)
                     VALUES ($1, $2, $3, $4)`,
                    [veteranId, "Supporting Document", file.originalname, file.path]
                );
            }
        }

        await client.query("COMMIT");

        return res.status(201).json({
            success: true,
            message: "Registration submitted successfully. Your account is pending verification."
        });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Registration error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error. Please try again."
        });
    } finally {
        client.release();
    }

};


// ===========================
// LOGIN
// ===========================

const loginUser = async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        // Find user
        const result = await db.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const user = result.rows[0];

        // Check account status
        if (user.account_status === "suspended") {
            return res.status(403).json({
                success: false,
                message: "Your account has been suspended. Contact support."
            });
        }

        // Check password
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                account_status: user.account_status
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error. Please try again."
        });
    }

};


module.exports = {
    registerUser,
    loginUser
};


*/


const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");


// ===========================
// REGISTER
// ===========================

const registerUser = async (req, res) => {

    console.log("STEP 1: entered registerUser");
    const client = await db.connect();
    console.log("STEP 2: connected to DB client");

    async function runQuery(description, text, params = []) {
        console.log(`QUERY START: ${description}`, { text, params });
        try {
            const result = await client.query(text, params);
            console.log(`QUERY SUCCESS: ${description}`, { rowCount: result.rowCount });
            return result;
        } catch (err) {
            console.error(`QUERY FAILED: ${description}`, err);
            throw err;
        }
    }

    try {

        await runQuery("BEGIN transaction", "BEGIN");

        const {
            first_name,
            last_name,
            gender,
            date_of_birth,
            national_id,
            phone,
            service_number,
            service_branch,
            rank,
            years_served,
            email,
            password
        } = req.body;

        if (
            !first_name || !last_name || !gender || !date_of_birth ||
            !national_id || !phone || !service_number || !service_branch ||
            !rank || !years_served || !email || !password
        ) {
            console.log("STEP 4: validation failed");
            await runQuery("ROLLBACK after validation", "ROLLBACK");
            return res.status(400).json({
                success: false,
                message: "Please complete all required fields."
            });
        }

        console.log("STEP 5: validation passed");

        // Check duplicate email
        const existingEmail = await runQuery(
            "Check duplicate email",
            "SELECT id FROM users WHERE email = $1",
            [email]
        );
        if (existingEmail.rows.length > 0) {
            console.log("STEP 6: duplicate email found");
            await runQuery("ROLLBACK after duplicate email", "ROLLBACK");
            return res.status(409).json({
                success: false,
                message: "Email already registered."
            });
        }

        // Check duplicate National ID
        const existingNIN = await runQuery(
            "Check duplicate national ID",
            "SELECT id FROM veterans WHERE national_id = $1",
            [national_id]
        );
        if (existingNIN.rows.length > 0) {
            console.log("STEP 7: duplicate national ID found");
            await runQuery("ROLLBACK after duplicate national ID", "ROLLBACK");
            return res.status(409).json({
                success: false,
                message: "National ID already registered."
            });
        }

        // Check duplicate Service Number
        const existingServiceNum = await runQuery(
            "Check duplicate service number",
            "SELECT id FROM veterans WHERE service_number = $1",
            [service_number]
        );
        if (existingServiceNum.rows.length > 0) {
            console.log("STEP 8: duplicate service number found");
            await runQuery("ROLLBACK after duplicate service number", "ROLLBACK");
            return res.status(409).json({
                success: false,
                message: "Service number already registered."
            });
        }

        console.log("STEP 9: duplicate checks passed");
        console.log("STEP 10: hashing password");
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("STEP 11: password hashed");

        // Create user account
        const userResult = await runQuery(
            "Insert user account",
            `INSERT INTO users (email, password)
             VALUES ($1, $2) RETURNING id`,
            [email, hashedPassword]
        );
        const userId = userResult.rows[0]?.id;
        console.log("STEP 12: user inserted", { userId });

        // Create veteran profile
        const veteranResult = await runQuery(
            "Insert veteran profile",
            `INSERT INTO veterans
             (user_id, first_name, last_name, gender, date_of_birth,
              national_id, phone, service_number, service_branch, rank, years_served)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
             RETURNING id`,
            [
                userId, first_name, last_name, gender, date_of_birth,
                national_id, phone, service_number, service_branch, rank, years_served
            ]
        );

        const veteranId = veteranResult.rows[0]?.id;
        console.log("STEP 13: veteran inserted", { veteranId });

        // Save uploaded documents
        const files = req.files || {};
        console.log("STEP 14: files object", { filesKeys: Object.keys(files) });

        async function saveDocument(field, type) {
            console.log(`STEP 15: saveDocument start for ${field}`);
            if (!files[field] || files[field].length === 0) {
                console.log(`STEP 15: no file for ${field}`);
                return;
            }
            const file = files[field][0];
            console.log(`STEP 15: saving document ${field}`, { originalname: file.originalname, path: file.path });
            await runQuery(
                `Insert document ${field}`,
                `INSERT INTO verification_documents
                 (veteran_id, document_type, file_name, file_path)
                 VALUES ($1, $2, $3, $4)`,
                [veteranId, type, file.originalname, file.path]
            );
            console.log(`STEP 15: saved document ${field}`);
        }

        await saveDocument("national_id_file", "National ID");
        await saveDocument("army_id_file", "Army ID");
        await saveDocument("discharge_file", "Discharge Certificate");

        if (files.supporting_docs && files.supporting_docs.length > 0) {
            console.log("STEP 16: saving supporting_docs", { count: files.supporting_docs.length });
            for (const file of files.supporting_docs) {
                console.log("STEP 16: inserting supporting_doc", { originalname: file.originalname, path: file.path });
                await runQuery(
                    "Insert supporting document",
                    `INSERT INTO verification_documents
                     (veteran_id, document_type, file_name, file_path)
                     VALUES ($1, $2, $3, $4)`,
                    [veteranId, "Supporting Document", file.originalname, file.path]
                );
            }
        } else {
            console.log("STEP 16: no supporting_docs provided");
        }

        await runQuery("COMMIT transaction", "COMMIT");

        return res.status(201).json({
            success: true,
            message: "Registration submitted successfully. Your account is pending verification."
        });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Registration error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error. Please try again."
        });
    } finally {
        client.release();
    }

};


// ===========================
// LOGIN  (accepts email, National ID, or service number)
// ===========================

const loginUser = async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email / ID and password are required."
            });
        }

        // Single query checks all three identifiers at once
        const result = await db.query(
            `SELECT u.*
             FROM users u
             LEFT JOIN veterans v ON v.user_id = u.id
             WHERE u.email = $1
                OR v.national_id = $1
                OR v.service_number = $1
             LIMIT 1`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "No account found with that email, National ID, or service number."
            });
        }

        const user = result.rows[0];

        if (user.account_status === "suspended") {
            return res.status(403).json({
                success: false,
                message: "Your account has been suspended. Contact support."
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Incorrect password."
            });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                account_status: user.account_status
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error. Please try again."
        });
    }

};


module.exports = {
    registerUser,
    loginUser
};