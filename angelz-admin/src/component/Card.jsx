const CardComponent = ({ ...card }) => {
  return (
    <div className={`p-3 rounded-lg shadow-md bg-white`}>
      <div className="flex flex-col">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-lg font-bold text-admin_text_grey">
            Total {card.name}
          </h2>
          {/* <div className="text-4xl">{card.icon}</div>  */}
        </div>
        <div className="text-start">
          <p className="text-3xl font-bold">{card.amount}</p>
          {/* <div className="flex mb-0 items-center space-x-2">
            <p
              className={`text-base mb-0 ${
                card.percentage >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {card.percentage >= 0
                ? `+${card.percentage}%`
                : `${card.percentage}%`}
            </p>
            <p className="mb-0 text-admin_text_grey font-medium">{card.text}</p>
          </div> */}
        </div>
      </div>
    </div>
  );
};
export default CardComponent;
