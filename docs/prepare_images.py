import shutil
import os

images_dir = 'docs/images'
mobile_dir = os.path.join(images_dir, 'moblie app sceen shot')

copies = [
    (os.path.join(mobile_dir, 'WhatsApp Image 2026-09-30 at 21.02.56.jpeg'), os.path.join(images_dir, 'flutter_screen_auth_portal.jpeg')),
    (os.path.join(mobile_dir, 'WhatsApp Image 2026-09-30 at 21.02.56 (1).jpeg'), os.path.join(images_dir, 'flutter_screen_coordinator_dashboard.jpeg')),
    (os.path.join(mobile_dir, 'WhatsApp Image 2026-09-30 at 21.02.57.jpeg'), os.path.join(images_dir, 'flutter_screen_citizen_hub.jpeg')),
    (os.path.join(mobile_dir, 'WhatsApp Image 2026-09-30 at 21.02.57 (1).jpeg'), os.path.join(images_dir, 'flutter_screen_resources_logistics.jpeg')),
    (os.path.join(images_dir, 'database deployee sceen shot.jpg'), os.path.join(images_dir, 'database_supabase_deployment_overview.jpg')),
    (os.path.join(images_dir, 'database table deployee ment sceent shot.jpg'), os.path.join(images_dir, 'database_supabase_tables_production.jpg')),
    (os.path.join(images_dir, 'backend deploeement.jpg'), os.path.join(images_dir, 'backend_railway_networking_domain.jpg')),
    (os.path.join(images_dir, 'backend deployment .jpg'), os.path.join(images_dir, 'backend_railway_deployment_active.jpg')),
]

for src, dst in copies:
    if os.path.exists(src):
        shutil.copy2(src, dst)
        print(f"Copied {src} -> {dst}")
    else:
        print(f"Warning: {src} does not exist!")
