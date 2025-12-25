-- Couples Therapy Assistant Database Schema
-- SurrealDB Schema Definition

-- Users table (synced from Firebase)
DEFINE TABLE users SCHEMAFULL;
DEFINE FIELD firebase_uid ON users TYPE string;
DEFINE FIELD email ON users TYPE string ASSERT string::is::email($value);
DEFINE FIELD display_name ON users TYPE option<string>;
DEFINE FIELD intake_completed ON users TYPE bool DEFAULT false;
DEFINE FIELD intake_data ON users TYPE option<object>;
DEFINE FIELD created_at ON users TYPE datetime DEFAULT time::now();
DEFINE INDEX firebase_uid_idx ON users FIELDS firebase_uid UNIQUE;
DEFINE INDEX email_idx ON users FIELDS email UNIQUE;

-- Relationships table
DEFINE TABLE relationships SCHEMAFULL;
DEFINE FIELD partner_a_id ON relationships TYPE record<users>;
DEFINE FIELD partner_b_id ON relationships TYPE option<record<users>>;
DEFINE FIELD status ON relationships TYPE string ASSERT $value IN ['pending', 'active', 'unpaired'];
DEFINE FIELD invitation_token ON relationships TYPE option<string>;
DEFINE FIELD invitation_email ON relationships TYPE option<string>;
DEFINE FIELD created_at ON relationships TYPE datetime DEFAULT time::now();
DEFINE FIELD confirmed_at ON relationships TYPE option<datetime>;

-- Conflicts table (for conversational model)
DEFINE TABLE conflicts SCHEMAFULL;
DEFINE FIELD relationship_id ON conflicts TYPE record<relationships>;
DEFINE FIELD created_by ON conflicts TYPE record<users>;
DEFINE FIELD title ON conflicts TYPE string;
DEFINE FIELD status ON conflicts TYPE string ASSERT $value IN ['exploring', 'synthesizing', 'guidance', 'shared', 'archived'];
DEFINE FIELD privacy_setting ON conflicts TYPE string ASSERT $value IN ['private', 'shared'];
DEFINE FIELD created_at ON conflicts TYPE datetime DEFAULT time::now();

-- Conversation sessions table
DEFINE TABLE conversation_sessions SCHEMAFULL;
DEFINE FIELD conflict_id ON conversation_sessions TYPE record<conflicts>;
DEFINE FIELD user_id ON conversation_sessions TYPE record<users>;
DEFINE FIELD session_type ON conversation_sessions TYPE string ASSERT $value IN ['individual_a', 'individual_b', 'joint_context_a', 'joint_context_b', 'relationship_shared'];
DEFINE FIELD status ON conversation_sessions TYPE string ASSERT $value IN ['active', 'finalized'];
DEFINE FIELD created_at ON conversation_sessions TYPE datetime DEFAULT time::now();
DEFINE FIELD finalized_at ON conversation_sessions TYPE option<datetime>;

-- Conversation messages table
DEFINE TABLE conversation_messages SCHEMAFULL;
DEFINE FIELD session_id ON conversation_messages TYPE record<conversation_sessions>;
DEFINE FIELD role ON conversation_messages TYPE string ASSERT $value IN ['user', 'assistant'];
DEFINE FIELD sender_id ON conversation_messages TYPE option<record<users>>;
DEFINE FIELD content ON conversation_messages TYPE string;
DEFINE FIELD tokens_used ON conversation_messages TYPE option<int>;
DEFINE FIELD created_at ON conversation_messages TYPE datetime DEFAULT time::now();
