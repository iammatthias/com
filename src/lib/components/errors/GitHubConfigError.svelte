<script lang="ts">
	// Props: error message to display
	export let message: string = 'GitHub API configuration error';
</script>

<div class="github-error">
	<div class="error-container">
		<h2>GitHub Integration Issue</h2>
		<p>{message}</p>

		<div class="help-section">
			<h3>Troubleshooting</h3>
			<ul>
				<li>
					Check that your GitHub personal access token is valid and has the necessary permissions
				</li>
				<li>Verify that the repository owner and name are correct</li>
				<li>
					Ensure all required environment variables are set:
					<ul>
						<li><code>GITHUB_TOKEN</code></li>
						<li><code>GITHUB_REPO_OWNER</code></li>
						<li><code>GITHUB_REPO_NAME</code></li>
						<li><code>GITHUB_CONTENT_PATH</code></li>
					</ul>
				</li>
				<li>Check server logs for more detailed error information</li>
			</ul>
		</div>
	</div>
</div>

<style>
	.github-error {
		padding: 2rem;
		margin: 2rem 0;
		border-radius: 0.5rem;
		background-color: #fff0f0;
		border: 1px solid #ffcaca;
	}

	.error-container {
		max-width: 800px;
		margin: 0 auto;
	}

	h2 {
		color: #d32f2f;
		margin-top: 0;
	}

	.help-section {
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid #ffcaca;
	}

	h3 {
		color: #333;
		margin-top: 0;
	}

	ul {
		padding-left: 1.5rem;
	}

	li {
		margin-bottom: 0.5rem;
	}

	code {
		background-color: #f8f8f8;
		padding: 0.2rem 0.4rem;
		border-radius: 0.25rem;
		font-family: monospace;
	}
</style>
