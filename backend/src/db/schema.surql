-- Embeddings Table Schema for Vector Storage
-- Stores text embeddings from OpenAI text-embedding-3-small model (1536 dimensions)

DEFINE TABLE embedding SCHEMAFULL;

DEFINE FIELD userId ON embedding TYPE string;
DEFINE FIELD content ON embedding TYPE string;
DEFINE FIELD embedding ON embedding TYPE array<float>;
DEFINE FIELD metadata ON embedding TYPE object;
DEFINE FIELD metadata.type ON embedding TYPE string ASSERT $value IN ['intake', 'conflict', 'conversation'];
DEFINE FIELD metadata.sourceId ON embedding TYPE string;
DEFINE FIELD metadata.createdAt ON embedding TYPE string;

-- Vector index for similarity search using MTREE
-- Dimension 1536 matches text-embedding-3-small output
DEFINE INDEX embedding_vector_idx ON embedding FIELDS embedding MTREE DIMENSION 1536;

-- Index for fast user lookups
DEFINE INDEX embedding_user_idx ON embedding FIELDS userId;

-- Index for metadata type filtering
DEFINE INDEX embedding_type_idx ON embedding FIELDS metadata.type;
