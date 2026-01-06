-- Embeddings Table Schema for Vector Storage
-- Stores text embeddings from OpenAI text-embedding-3-small model (1536 dimensions)

DEFINE TABLE IF NOT EXISTS embedding SCHEMAFULL;

DEFINE FIELD IF NOT EXISTS userId ON embedding TYPE string;
DEFINE FIELD IF NOT EXISTS content ON embedding TYPE string;
DEFINE FIELD IF NOT EXISTS embedding ON embedding TYPE array<float>;
DEFINE FIELD IF NOT EXISTS metadata ON embedding TYPE object;
DEFINE FIELD IF NOT EXISTS metadata.type ON embedding TYPE string ASSERT $value IN ['intake', 'conflict', 'conversation'];
DEFINE FIELD IF NOT EXISTS metadata.sourceId ON embedding TYPE string;
DEFINE FIELD IF NOT EXISTS metadata.createdAt ON embedding TYPE string;

-- Vector index for similarity search using MTREE
-- Dimension 1536 matches text-embedding-3-small output
DEFINE INDEX IF NOT EXISTS embedding_vector_idx ON embedding FIELDS embedding MTREE DIMENSION 1536;

-- Index for fast user lookups
DEFINE INDEX IF NOT EXISTS embedding_user_idx ON embedding FIELDS userId;

-- Index for metadata type filtering
DEFINE INDEX IF NOT EXISTS embedding_type_idx ON embedding FIELDS metadata.type;

-- Prompt Log Table Schema for LLM Interaction Logging
-- Stores all prompts sent to LLMs for debugging and analysis

DEFINE TABLE IF NOT EXISTS prompt_log SCHEMAFULL;

DEFINE FIELD IF NOT EXISTS userId ON prompt_log TYPE string;
DEFINE FIELD IF NOT EXISTS userEmail ON prompt_log TYPE option<string>;
DEFINE FIELD IF NOT EXISTS userName ON prompt_log TYPE option<string>;
DEFINE FIELD IF NOT EXISTS conflictId ON prompt_log TYPE option<string>;
DEFINE FIELD IF NOT EXISTS conflictTitle ON prompt_log TYPE option<string>;
DEFINE FIELD IF NOT EXISTS sessionId ON prompt_log TYPE option<string>;
DEFINE FIELD IF NOT EXISTS sessionType ON prompt_log TYPE option<string>;
DEFINE FIELD IF NOT EXISTS logType ON prompt_log TYPE string ASSERT $value IN ['intake', 'exploration', 'guidance_refinement', 'individual_guidance', 'joint_context_guidance', 'relationship_synthesis', 'relationship_chat'];
DEFINE FIELD IF NOT EXISTS guidanceMode ON prompt_log TYPE option<string>;
DEFINE FIELD IF NOT EXISTS systemPrompt ON prompt_log TYPE string;
DEFINE FIELD IF NOT EXISTS userMessage ON prompt_log TYPE string;
DEFINE FIELD IF NOT EXISTS aiResponse ON prompt_log TYPE string;
DEFINE FIELD IF NOT EXISTS inputTokens ON prompt_log TYPE int;
DEFINE FIELD IF NOT EXISTS outputTokens ON prompt_log TYPE int;
DEFINE FIELD IF NOT EXISTS cost ON prompt_log TYPE float;
DEFINE FIELD IF NOT EXISTS createdAt ON prompt_log TYPE string;

-- Indexes for efficient querying
DEFINE INDEX IF NOT EXISTS prompt_log_user_idx ON prompt_log FIELDS userId;
DEFINE INDEX IF NOT EXISTS prompt_log_type_idx ON prompt_log FIELDS logType;
DEFINE INDEX IF NOT EXISTS prompt_log_created_idx ON prompt_log FIELDS createdAt;
