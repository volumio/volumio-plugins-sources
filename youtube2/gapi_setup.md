#### Guide to setting up Google API credentials

**1. Create Project**

- Go to [Google Cloud Platform](https://console.cloud.google.com/apis/dashboard).
- Next to the Google Cloud Platform title, you will see a dropdown menu that says 'Select a Project' or the name of a project that you previously worked on. Click the dropdown menu, then select 'New Project'.
- Give your project a name or use the one suggested. Leave the Location field as is, then click 'Create'.
- Wait a moment while the project is being created. After it has been created, verify that it is the current active project by clicking the dropdown menu next to the 'Google Cloud Platform' title.

**2. Enable YouTube API**

- On the dashboard of your newly-created project, click 'Enable APIs and Services'.
- Scroll down until you reach the 'YouTube' section and select 'YouTube Data API v3'. Click 'Enable' in the screen that follows.
- At the next screen, click 'Create Credentials', but don't do anything yet. We will configure the OAuth consent screen first.

**3. Configure OAuth consent screen**

- Select 'OAuth consent screen' from the left menu.
- Choose 'External' for User Type, then click 'Create'.
- Enter App name (e.g. volumio-youtube-*your-username*), User support email and Developer contact information (your email address). Leave the rest of the fields empty, then click 'Save and Continue'.
- At the next screen, click 'Add or Remove Scopes'. Type 'youtube' in the Filter text field and hit Enter, then check the box for '.../auth/youtube.readonly'. Click 'Update', followed by 'Save and Continue'.
- At the next screen, click 'Add Users' and enter the email address for your YouTube account. Click 'Add', followed by 'Save and Continue'.

**4. Obtain Client ID / Secret**

- Select 'Credentials' from the left menu.
- Click 'Create Credentials' and choose 'OAuth Client ID'.
- Select 'TVs and Limited Input devices' for Application Type, then click 'Create'.
- You will be presented with the Client ID and Secret.

That's it! You now have the Client ID and Secret needed for YouTube access. If you need these values later on, you can click the 'Edit' icon under 'OAuth 2.0 Client IDs' on the Credentials page.
