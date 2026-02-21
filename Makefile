.PHONY: start reset-project android ios web lint lint-fix test all

# Default target
all: lint test

install:
	cd frontend && npm install

build:
	cd frontend && npm run build

# Start the Expo development server
start:
	cd frontend && npm run start

# Reset the project
reset-project:
	cd frontend && npm run reset-project

# Start on Android
android:
	cd frontend && npm run android

# Start on iOS
ios:
	cd frontend && npm run ios

# Start on Web
web:
	cd frontend && npm run web

# Run linting
lint:
	cd frontend && npm run lint

# Run linting with auto-fix + Prettier
lint-fix:
	cd frontend && npm run lint:fix

# Run tests
test:
	cd frontend && npm run test

clean:
	cd frontend && npm run clean
