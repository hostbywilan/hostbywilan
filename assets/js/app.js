let dateAvailability,globalPicker;

function isFormBookingReady(){
	isEmptyData = [];
	
	[
		"dateCheckIn",
		"dateCheckOut",
		"totalNights",
		"totalPricesUSD",
		"totalPricesIDR",
		"guestName",
		"guestPhone"
	].forEach(function(v,i){
		if(typeof $("#datepicker").data(v) == "undefined"){
			isEmptyData.push(v);
		}
	});
	
	if(isEmptyData.length>0){
		$("#submit-booking").attr("disabled", true);
		return false;
	}else{
		$("#submit-booking").attr("disabled", false);
		return true;
	}
}

function disableSubmitBooking(){
		$(".booking-form").each(function(){
			$(this).attr("disabled", true);
		});
		$("#submit-booking").attr("disabled", true);
		$("#formulir-booking").addClass("d-none"); 
		$("#formulir-booking-loader").removeClass("d-none"); 
}

function enableSubmitBooking(){
		$(".booking-form").each(function(){
			$(this).attr("disabled", false);
		});
		$("#submit-booking").attr("disabled", false);
		$("#formulir-booking").removeClass("d-none"); 
		$("#formulir-booking-loader").addClass("d-none"); 
}

$(function() {
	isFormBookingReady();
	
	$.get("https://script.google.com/macros/s/AKfycbynwtAJvZqvIlWOLAyIEK41eGPoGHrZsSpNFH7Df1kfzPJlShARiZ2-nEKvWAPDLsoP-w/exec?action=getAvailability", function(res, stat){
		if(res.statusCode == 1 && stat == 'success'){
			dateAvailability = res.dateAvailability;
			const DateTime = easepick.DateTime;
			const bookedDates = dateAvailability.bookedDates.map(d => {
				if (d instanceof Array) {
					const start = new DateTime(d[0], 'YYYY-MM-DD');
					const end = new DateTime(d[1], 'YYYY-MM-DD');

					return [start, end];
				}

				return new DateTime(d, 'YYYY-MM-DD');
			});
			const picker = new easepick.create({
				element: '#datepicker',
				firstDay: 0,
				inline: true,
				lang: 'id-ID',
				css: [
					'https://cdn.jsdelivr.net/npm/@easepick/bundle@1.2.0/dist/index.css',
					'https://easepick.com/css/demo_hotelcal.css',
				],
				plugins: ['RangePlugin', 'LockPlugin'],
				RangePlugin: {
					tooltipNumber(num) {
						return num - 1;
					},
					locale: {
						one: 'malam',
						other: 'malam',
					},
				},
				LockPlugin: {
					minDate: new Date(),
					maxDate: dateAvailability.maxDate,
					minDays: 2,
					selectForward: true,
					inseparable: true,
					filter(date, picked) {
						if (picked.length === 1) {
						  const incl = date.isBefore(picked[0]) ? '[)' : '(]';
						  return !picked[0].isSame(date, 'day') && date.inArray(bookedDates, incl);
						}

						return date.inArray(bookedDates, '[)');
					},
				},
				setup(picker) {
					picker.resetDateAvailability = function(){
						newMaxDate = new Date(Date.parse(dateAvailability.maxDate));
					    picker.PluginManager.picker.PluginManager.instances.LockPlugin.options.maxDate.setDate(newMaxDate.getDate());
					    
					    picker.PluginManager.picker.PluginManager.instances.LockPlugin.options.filter = function(date, picked) {
						  	if (picked.length === 1) {
						  	  const incl = date.isBefore(picked[0]) ? '[)' : '(]';
						  	  return !picked[0].isSame(date, 'day') && date.inArray(bookedDates, incl);
						  	}
						  
						  	return date.inArray(bookedDates, '[)');
					    };

						picker.renderAll();
					}
					
					picker.on('select', (e) => {
						$("#datepicker").html(`<div class="lds-dual-ring"></div>`);
						
						picker.resetDateAvailability();
						
						let { start, end } = e.detail;

						let nights = Math.round(Math.abs((end - start) / (24 * 60 * 60 * 1000)));

						$.get(`https://script.google.com/macros/s/AKfycbynwtAJvZqvIlWOLAyIEK41eGPoGHrZsSpNFH7Df1kfzPJlShARiZ2-nEKvWAPDLsoP-w/exec?action=getPrices&startDate=${ymdDate(start)}&endDate=${ymdDate(end)}`, function(res, stat){
							if(stat == 'success'){
								let prices = res.prices,
								priceDisplayIDR = prices.IDR.toLocaleString('id-ID', {
								  style: 'currency',
								  currency: 'IDR',
								}),
								priceDisplayUSD = prices.USD.toLocaleString('en-US', {
								  style: 'currency',
								  currency: 'USD',
								}),
								priceIDR = prices.IDR,
								priceDisplayIDRperNights = (prices.IDR/nights).toLocaleString('id-ID', {
								  style: 'currency',
								  currency: 'IDR',
								}),
								priceUSD = prices.USD,
								priceDisplayUSDperNights = (prices.USD/nights).toLocaleString('en-US', {
								  style: 'currency',
								  currency: 'USD',
								});
								
								$("#datepicker").html(`
								<div class="col-md-12 form-group text-center">
									<div class="row">
										<div class="col-12 text-start">
											<div class="row">
												<div class="col-12 mt-1">
														<div class="row">
															<div class="row">
																<div class="col-2"></div>
																<div class="col-3 text-start">
																	<span class="badge bg-success">Check-In</span>
																</div>
																<div class="col text-start">
																	<small>${toIdn(start)['hari']}, ${toIdn(start)['tanggal']} ${toIdn(start)['bulan']} ${toIdn(start)['tahun']}</small>
																</div>
															</div>
														</div>
												</div>
											</div>
											<div class="row">
												<div class="col-12 mt-1 mb-3">
													<div class="row">
															<div class="row">
																<div class="col-2"></div>
																<div class="col-3 text-start">
																	<span class="badge bg-primary">Check-Out</span>
																</div>
																<div class="col text-start">
																	<small>${toIdn(end)['hari']}, ${toIdn(end)['tanggal']} ${toIdn(end)['bulan']} ${toIdn(end)['tahun']}</small>
																</div>
															</div>
													</div>
												</div>
											</div>
										</div>
										<div class="col-md-12 text-center">
											<small>${priceDisplayIDRperNights} / malam</small><br/>
											<sup class="text-muted">${priceDisplayUSDperNights} / malam</sup><br/>
											<span class="badge" style="background-color:#912e6d;">X ${nights} malam</span>
										</div>
										<div class="col-md-12 text-center mt-1">
											<h5><span class="badge" style="background-color:#912e6d;">Total</span></h5>
											${priceDisplayIDR}<br/>
										</div>
										<div class="col-md-12 text-center mb-3">
											<small class="text-muted">(${priceDisplayUSD})</small><br/>
											<sup class="text-muted">(Belum termasuk deposit Rp 500.000)</sup>
										</div>
										<div class="col-md-12 text-center mt-1 mb-3">
											<button id="reservation-reset" type="button" class="btn btn-sm btn-outline-danger"><i class="bi bi-x-circle"></i> Reset Tanggal</button>
										</div>
									<div>
								</div>
								`);
								$("#datepicker").data("dateCheckIn", ymdDate(start));
								$("#datepicker").data("dateCheckOut", ymdDate(end));
								$("#datepicker").data("totalNights", nights);
								$("#datepicker").data("totalPricesUSD", priceUSD);
								$("#datepicker").data("totalPricesIDR", priceIDR);
								if($("#guest-name").val()) $("#datepicker").data("guestName", $("#guest-name").val());
								if($("#guest-phone").val()){
									if(libphonenumber.isValidNumber($("#guest-phone").val(), 'ID')){
										$("#datepicker").data("guestPhone", $("#guest-phone").val());
									}else{
										$("#datepicker").removeData("guestPhone");
									}
								}
								if($("#guest-message").val()) $("#datepicker").data("guestMessage", $("guest-message").val());
								
								isFormBookingReady();
						  
								$("#reservation-reset").click(function() {
									picker.clear();
								});
							}
						});
					});
					picker.on('preselect', (e) => {
						newMaxDate = new Date(Date.parse(res.dateAvailability.maxDate));
						newMaxDate.setDate(newMaxDate.getDate() + 1);
						picker.PluginManager.picker.PluginManager.instances.LockPlugin.options.maxDate.setDate(newMaxDate.getDate());
						
						newBookedDates = res.dateAvailability.bookedDates.map(d => {
							  if (d instanceof Array) {
								const start = new DateTime(d[0], 'YYYY-MM-DD');
								const end = new DateTime(d[1], 'YYYY-MM-DD');
								start.setDate(start.getDate() + 1);
								end.setDate(end.getDate() + 1);

								return [start, end];
							  }
							  
							  const date = new DateTime(d, 'YYYY-MM-DD');
							  date.setDate(date.getDate() + 1);
							  
							  return date;
						});
						
						picker.PluginManager.picker.PluginManager.instances.LockPlugin.options.filter = function(date, picked) {
							if (picked.length === 1) {
							  const incl = date.isBefore(picked[0]) ? '[)' : '(]';
							  return !picked[0].isSame(date, 'day') && date.inArray(newBookedDates, incl);
							}
						
							return date.inArray(newBookedDates, '[)');
						};
						
						$(document).keyup(function(e) {
							 if (e.key === "Escape") { // escape key maps to keycode `27`
								picker.clear();
							}
						});
						
						$("body").on("click", function(e) {
							if($(e.target).is(picker.ui.wrapper) == false){
								picker.resetDateAvailability();
							}
						});
					});
					
					picker.on('clear', (e) => {				
						$("#datepicker").html(`<div class="col-md-12 form-group text-center"><h5>Pilih Tanggal Booking</h5></div>`);
						$("#datepicker").removeData("dateCheckIn");
					    $("#datepicker").removeData("dateCheckOut");
					    $("#datepicker").removeData("totalNights");
					    $("#datepicker").removeData("totalPricesUSD");
					    $("#datepicker").removeData("totalPricesIDR");
						isFormBookingReady();
						picker.resetDateAvailability();
					});
				}
			});
			  
			globalPicker = picker;
		}
	});
	
	$(".booking-form").each(function(){
		$(this).on("keyup change oninput", function(){
			if($(this).val()){
				if($(this).attr("name") == "guestPhone"){
					if(libphonenumber.isValidNumber($(this).val(), 'ID')){
						$("#datepicker").data($(this).attr("name"), $(this).val());
					}else{
						$("#datepicker").removeData($(this).attr("name"));
					}
				}else{
					$("#datepicker").data($(this).attr("name"), $(this).val());
				}
			}else{
				$("#datepicker").removeData($(this).attr("name"));
			}
			isFormBookingReady();
		});
	});
	
	$("#submit-booking").on("click", function(e){
		e.preventDefault;
		disableSubmitBooking();
		$("#formulir-booking").addClass("d-none"); 
		var settings = {
		  "url": "https://script.google.com/macros/s/AKfycbynwtAJvZqvIlWOLAyIEK41eGPoGHrZsSpNFH7Df1kfzPJlShARiZ2-nEKvWAPDLsoP-w/exec?action=submitBooking",
		  "method": "POST",
		  "timeout": 0,
		  "headers": {
			"Content-Type": "application/x-www-form-urlencoded"
		  },
		  "data": $("#datepicker").data()
		};

		if(isFormBookingReady()){
			$.ajax(settings).done(function (rsp) {
				if(rsp.statusCode == 1){
					Swal.fire({
						icon: 'success',
						iconColor: '#991188',
						title: '',
						html: rsp.statusText,
						confirmButtonColor: '#991188'
					});
					globalPicker.clear();
					$(".booking-form").each(function(){
						$(this).val("");
					});
				}else{
					Swal.fire({
						icon: 'error',
						title: 'Oops...',
						text: rsp.statusText,
						confirmButtonColor: '#991188'
					});
				}
				
				enableSubmitBooking();
			});
		}else{
			Swal.fire({
				icon: 'error',
				title: 'Oops...',
				text: 'Silahkan lengkapi data, dan pastikan data valid',
				confirmButtonColor: '#991188'
			});
			
			enableSubmitBooking()
		}
	});
});