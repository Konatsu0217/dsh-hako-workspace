# dsh-hako-workspace

Workspace Graph for DeepSeek Harness. This plugin adds a local, many-to-many graph of real work resources instead of another content silo. Nodes are references to files, directories, URLs, sessions, decisions, todos, artifacts, notes, feed items, and worlds. Edges record why two resources are related.

## Features

- **Reference graph**: store identity, metadata, relationships, provenance, and a pointer `uri`; keep real content in its original file, directory, URL, or DSH session.
- **Many-to-many worlds**: a node can belong to multiple worlds at once. A world is itself a node. The root world is the empty string `""`.
- **Per-world layout**: layout coordinates live on the membership between a node and a world, so the same node can be arranged differently in different worlds.
- **Canvas UI**: a DSH Web sidebar entry opens an editable graph canvas with search, filters, nested worlds, links, node editing, and drag layout persistence.
- **Model surface**: one skill, `hako-workspace`, and one action-envelope tool, `hako_workspace`.
- **Local storage**: SQLite with WAL, FTS5, indexed structured columns, and optimistic revision checks.
- **Safe context model**: returned graph data is navigation context. Verify actionable facts against the referenced source URI.

## Installation

Install the package into a DSH profile and include its bundle patch in the profile composition.

Example profile dependency:

```json
{
  "dependencies": {
    "dsh-hako-workspace": "<version-or-local-path>"
  }
}
```

Example profile patch:

```yaml
- insert:
    - id: dsh-hako-workspace
      name: dsh-hako-workspace
```

If you need a custom database location, pass `storePath`:

```yaml
- insert:
    - id: dsh-hako-workspace
      name: dsh-hako-workspace
      config:
        storePath: /absolute/path/to/workspace.db
```

Restart DSH after changing profile dependencies or bundle composition.

## Model surface

The plugin registers exactly one skill and one tool:

- Skill `hako-workspace`: load it to get the full action protocol and safety guidance.
- Tool `hako_workspace({ action, input })`: one action envelope.

Actions:

- Read: `overview`, `resume`, `search`, `context`, `get`, `list_world`
- Write: `upsert_node`, `link`, `unlink`, `delete_node`, `add_to_world`, `remove_from_world`, `archive_session`

Important input notes:

- `upsert_node` accepts `worlds` to place a node in one or more worlds.
- Membership layout is stored through `add_to_world` / `POST /membership`.
- Nodes and edges expose monotonically increasing `revision`; callers may pass `expectedRevision` for optimistic concurrency.
- Agent-authored observations should use `owner: "agent"` and an appropriate `assertionLevel`, usually `"proposed"` until confirmed.

## UI routes

The browser UI talks to same-origin routes mounted under `/dsh-hako-workspace`:

- `GET /world?worldId=`: members of one world with per-membership layout and internal edges
- `GET /overview`, `GET /get?id=`
- `POST /search`, `POST /resume`, `POST /context`
- `POST /node`, `DELETE /node`
- `POST /edge`, `DELETE /edge`
- `POST /membership`, `DELETE /membership`
- `POST /archive`

Mutation routes require a same-origin `Origin` header. Revision conflicts return HTTP 409.

## Layout persistence

The canvas stores user-edited positions as world memberships. Dragging a node queues a layout update. Pending layout changes are flushed:

- periodically while pending changes exist,
- before link/edit/delete operations that reload the graph,
- when the page is hidden, unloaded, or the React component is disposed.

This avoids losing recent manual placement when the DSH client does not provide a business-specific page-leave lifecycle.

## Storage

By default, graph data is stored under the active DSH profile-like path:

```text
$DSH_HOME/profiles/<profile>/.dsh-hako-workspace/workspace.db
```

The store uses SQLite schema version 3. Databases at other versions are rejected on open; there is no migration from older prototypes. Node.js 22.5 or newer is required for the built-in `node:sqlite` module.

Tables:

- `nodes`: identity, pointer URI, provenance, owner, visibility, assertion status, lifecycle
- `memberships`: many-to-many node/world membership with per-world layout
- `edges`: typed relations between nodes

Read paths filter `unauthorized`, `deleted`, and `missing` resources before returning data.

## Development

```sh
npm test
npm run build
```

The package is plain ESM JavaScript. `scripts/build.mjs` copies source files to `lib/` and emits minimal declaration files so the package can be installed directly while the plugin evolves.

## Package contents

The package publishes:

- `lib/`
- `src/`
- `cordis.patch.yml`
- `README.md`
- `LICENSE`
