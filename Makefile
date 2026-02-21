.PHONY: start reset-project android ios web lint lint-fix test all

# Default target
all: lint test

install:
	cd shadowsound && npm install

build:
	cd shadowsound && npm run build

# Start the Expo development server
start:
	cd shadowsound && npm run start

# Reset the project
reset-project:
	cd shadowsound && npm run reset-project

# Start on Android
android:
	cd shadowsound && npm run android

# Start on iOS
ios:
	cd shadowsound && npm run ios

# Start on Web
web:
	cd shadowsound && npm run web

# Run linting
lint:
	cd shadowsound && npm run lint

# Run linting with auto-fix + Prettier
lint-fix:
	cd shadowsound && npm run lint:fix

# Run tests
test:
	cd shadowsound && npm run test

clean:
	cd shadowsound && npm run clean
