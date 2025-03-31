<script lang="ts">
	import { onMount } from 'svelte';
	// Remove server-side import that causes the client-side error
	// import { invalidateGitHubCache } from '$lib/services/github';

	let status = 'loading';
	let message = 'Checking GitHub API connection...';
	let fileCount = 0;
	let files: any[] = [];
	let isLoading = true;
	let errorDetails = '';
	let lastChecked = '';

	// Add cache control state
	let isCacheClearing = false;
	let cacheMessage = '';

	onMount(async () => {
		await checkGitHubStatus();
	});

	async function checkGitHubStatus() {
		isLoading = true;
		try {
			const response = await fetch('/api/github-test');
			const data = await response.json();

			status = data.success ? 'success' : 'error';
			message = data.message;
			fileCount = data.fileCount || 0;
			files = data.files || [];
			errorDetails = data.error || '';

			// Update last checked time
			lastChecked = new Date().toLocaleTimeString();
		} catch (error) {
			status = 'error';
			message = 'Failed to connect to GitHub API';
			errorDetails = error instanceof Error ? error.message : 'Unknown error';
		} finally {
			isLoading = false;
		}
	}

	// Add function to clear GitHub cache - using the revalidation endpoint
	async function clearCache() {
		isCacheClearing = true;
		cacheMessage = 'Clearing cache...';

		try {
			// Call our revalidation endpoint
			const response = await fetch('/api/revalidate');

			if (response.ok) {
				const data = await response.json();
				cacheMessage = data.message;
				// Force a fresh check to the GitHub API
				await checkGitHubStatus();
			} else {
				const data = await response.json();
				cacheMessage = `Failed to clear cache: ${data.message || 'Unknown error'}`;
			}
		} catch (error) {
			cacheMessage = `Error clearing cache: ${
				error instanceof Error ? error.message : 'Unknown error'
			}`;
		} finally {
			isCacheClearing = false;
			// Clear the message after 5 seconds
			setTimeout(() => {
				cacheMessage = '';
			}, 5000);
		}
	}
</script>

<div class="github-status">
	<div class="status-header">
		<h3>GitHub API Status</h3>
		{#if !isLoading}
			<div class="last-checked">Last checked: {lastChecked}</div>
		{/if}
		<div class="status-actions">
			<button on:click={checkGitHubStatus} class="refresh-button" disabled={isLoading}>
				{isLoading ? 'Checking...' : 'Refresh'}
			</button>
			<button on:click={clearCache} class="cache-button" disabled={isCacheClearing || isLoading}>
				{isCacheClearing ? 'Clearing...' : 'Clear Cache'}
			</button>
		</div>
	</div>

	{#if cacheMessage}
		<div class="cache-message" class:success={cacheMessage.includes('success')}>
			{cacheMessage}
		</div>
	{/if}

	<div class="status-indicator {status}">
		{#if isLoading}
			<span class="loading-spinner"></span>
		{:else if status === 'success'}
			<span class="status-icon">✓</span>
		{:else}
			<span class="status-icon">✗</span>
		{/if}
		<span class="status-text">{message}</span>
	</div>

	{#if status === 'success' && fileCount > 0}
		<div class="file-stats">
			<p>Found {fileCount} content files in repository.</p>
			<div class="caching-info">
				<h4>Caching Information</h4>
				<ul>
					<li>Content is now cached for 1 hour to improve performance</li>
					<li>Cache is automatically refreshed when content changes via webhooks</li>
					<li>For local development: manually refresh using the "Clear Cache" button</li>
				</ul>
			</div>
			<details>
				<summary>Show file list ({files.length} items)</summary>
				<ul class="file-list">
					{#each files as file}
						<li>
							<span class="file-icon">{file.type === 'dir' ? '📁' : '📄'}</span>
							<span class="file-path">{file.path}</span>
						</li>
					{/each}
				</ul>
			</details>
		</div>
	{:else if status === 'error' && errorDetails}
		<div class="error-details">
			<p>Error details:</p>
			<pre>{errorDetails}</pre>
		</div>
	{/if}
</div>

<style>
	.github-status {
		background-color: #f5f5f5;
		border-radius: 0.5rem;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.status-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.status-header h3 {
		margin: 0;
		flex-grow: 1;
	}

	.last-checked {
		font-size: 0.8rem;
		color: #666;
		margin-right: 1rem;
	}

	.status-actions {
		display: flex;
		gap: 0.5rem;
	}

	button {
		background-color: #e0e0e0;
		border: none;
		border-radius: 4px;
		padding: 0.5rem 1rem;
		cursor: pointer;
		font-size: 0.9rem;
		transition: background-color 0.2s;
	}

	button:hover {
		background-color: #d0d0d0;
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.cache-button {
		background-color: #f0f0f0;
	}

	.cache-message {
		margin: 0.5rem 0;
		padding: 0.5rem;
		background-color: #f8d7da;
		border-radius: 0.25rem;
	}

	.cache-message.success {
		background-color: #d4edda;
	}

	.status-indicator {
		display: flex;
		align-items: center;
		padding: 1rem;
		border-radius: 0.25rem;
		margin-bottom: 1rem;
	}

	.status-indicator.loading {
		background-color: #e9ecef;
	}

	.status-indicator.success {
		background-color: #d4edda;
		color: #155724;
	}

	.status-indicator.error {
		background-color: #f8d7da;
		color: #721c24;
	}

	.status-icon {
		margin-right: 0.5rem;
		font-size: 1.25rem;
	}

	.loading-spinner {
		display: inline-block;
		width: 1rem;
		height: 1rem;
		margin-right: 0.5rem;
		border: 2px solid rgba(0, 0, 0, 0.1);
		border-left-color: #333;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.file-stats {
		margin-top: 1rem;
	}

	.file-stats p {
		margin: 0;
	}

	.caching-info {
		background-color: #e6f7ff;
		border-left: 3px solid #1890ff;
		padding: 1rem;
		border-radius: 0.25rem;
		margin: 1rem 0;
	}

	.caching-info h4 {
		margin-top: 0;
		margin-bottom: 0.5rem;
	}

	.caching-info ul {
		margin: 0;
		padding-left: 1.5rem;
	}

	details {
		margin-top: 1rem;
	}

	summary {
		cursor: pointer;
		user-select: none;
	}

	.file-list {
		list-style: none;
		padding: 0;
		margin: 0.5rem 0;
		max-height: 300px;
		overflow-y: auto;
	}

	.file-list li {
		padding: 0.25rem 0;
		display: flex;
		align-items: center;
	}

	.file-icon {
		margin-right: 0.5rem;
	}

	.error-details {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #ddd;
	}

	.error-details p {
		margin: 0 0 0.5rem 0;
	}

	pre {
		background-color: #f1f1f1;
		padding: 1rem;
		border-radius: 0.25rem;
		overflow-x: auto;
		font-size: 0.8rem;
		margin: 0;
	}
</style>
