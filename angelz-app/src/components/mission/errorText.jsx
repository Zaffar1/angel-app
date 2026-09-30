const ErrorText = ({ message }) => (
    <p className="text-center py-10 text-red-500">
        Failed to load mission: {message}
    </p>
);

export { ErrorText }