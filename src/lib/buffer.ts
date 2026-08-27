// Buffer's classic v1 REST API (api.buffer.com/1/updates/create.json) is dead --
// confirmed 2026-08 by testing it directly: every request, with a verified-valid
// token, comes back `{"errors":[{"message":"Unsupported Content-Type"}]}` no
// matter the auth method. api.buffer.com now serves GraphQL only. This file is
// rewritten against that GraphQL API (createPost mutation, mode: shareNow) so
// every existing caller -- queueInBuffer(profileIds, text, imageUrl) -- keeps
// working unchanged.
async function gql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const token = process.env.BUFFER_ACCESS_TOKEN;
  if (!token) throw new Error("BUFFER_ACCESS_TOKEN not configured");

  const response = await fetch("https://api.buffer.com", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Buffer ${response.status}: ${errText}`);
  }

  const json = await response.json();
  if (json.errors?.length) {
    throw new Error(`Buffer GraphQL error: ${json.errors.map((e: { message: string }) => e.message).join("; ")}`);
  }
  return json.data as T;
}

const CREATE_POST_MUTATION = `
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      ... on PostActionSuccess {
        post { id status }
      }
      ... on MutationError {
        message
      }
    }
  }
`;

export async function queueInBuffer(profileIds: string[], text: string, imageUrl?: string): Promise<void> {
  if (profileIds.length === 0) return;

  const assets = imageUrl ? [{ image: { url: imageUrl } }] : [];

  for (const channelId of profileIds) {
    const input = {
      channelId,
      text,
      schedulingType: "automatic",
      mode: "shareNow",
      needsApproval: false,
      assets,
    };
    const data = await gql<{ createPost: { message?: string; post?: { id: string; status: string } } }>(
      CREATE_POST_MUTATION,
      { input }
    );
    if (data.createPost?.message) {
      throw new Error(`Buffer createPost failed for channel ${channelId}: ${data.createPost.message}`);
    }
  }
}
